
'use server';

import { Telegraf, Markup, Scenes, session, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from 'dotenv';
import type { Plan, Category, Service, Account, Ticket, TicketDepartment, TicketPriority } from './types';

config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables.');
}

// --- MOCK DATABASE FUNCTIONS (to be replaced with real DB access) ---
// In a real application, these functions would query a database like Firebase Firestore or a SQL DB.
// Since the web panel uses localStorage, we simulate this data access for the server-side bot.

const mockData = {
    categories: [
        { id: '1', name: 'سرویس V2Ray', status: 'active' },
        { id: '2', name: 'لایسنس نرم‌افزار', status: 'active' },
    ] as Category[],
    plans: [
        { id: 'p1', categoryId: '1', name: 'پلن ۱ ماهه', price: 50000, durationDays: 30, status: 'active' },
        { id: 'p2', categoryId: '1', name: 'پلن ۳ ماهه', price: 120000, durationDays: 90, status: 'active' },
        { id: 'p3', categoryId: '2', name: 'لایسنس ویندوز ۱۱', price: 250000, durationDays: 365, status: 'active' },
    ] as (Plan & { categoryId: string })[],
    services: [
        { id: 's1', userId: 'tg-12345', planId: 'p1', clientEmail: 'v2ray_test_1', expiresAt: '2025-12-01T00:00:00Z' }
    ] as (Service & { userId: string})[],
    users: [
        { id: 'tg-12345', telegramId: 12345, name: 'کاربر تستی', email: 'test@example.com', walletBalance: 150000 }
    ] as (Partial<Account> & { telegramId: number, walletBalance: number })[]
};

async function findUserByTelegramId(telegramId: number): Promise<(Partial<Account> & { telegramId: number, walletBalance: number }) | undefined> {
    console.log(`Searching for user with Telegram ID: ${telegramId}`);
    return mockData.users.find(u => u.telegramId === telegramId);
}

async function getActiveCategories(): Promise<Category[]> {
    return mockData.categories.filter(c => c.status === 'active');
}

async function getPlansByCategoryId(categoryId: string): Promise<Plan[]> {
    return mockData.plans.filter(p => p.categoryId === categoryId && p.status === 'active');
}

async function getUserServices(userId: string): Promise<any[]> {
    return mockData.services
        .filter(s => s.userId === userId)
        .map(s => {
            const plan = mockData.plans.find(p => p.id === s.planId);
            return { ...s, planName: plan?.name || 'نامشخص' };
        });
}

// --- TELEGRAF BOT IMPLEMENTATION ---

interface SessionData {
  step: 'awaiting_ticket_subject' | 'awaiting_ticket_message' | null;
  ticketData: Partial<Ticket>;
}
interface MyContext extends Context {
  session: SessionData;
}

export const bot = token ? new Telegraf<MyContext>(token) : null;

if (bot) {
  // Use session middleware
  bot.use(session({
    defaultSession: () => ({ step: null, ticketData: {} })
  }));

  // START COMMAND - Main Menu
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id;
    let user = await findUserByTelegramId(telegramId);

    if (!user) {
      // For demonstration, create a new user if not found
      user = { id: `tg-${telegramId}`, telegramId, name: ctx.from.first_name, email: `${telegramId}@telegram.user`, walletBalance: 0 };
      mockData.users.push(user);
      console.log(`New user created: ${user.name}`);
    }

    const welcomeMessage = `سلام ${user.name} عزیز، به پنل مدیریت V-Admin خوش آمدید!`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🛍️ خرید سرویس', 'buy_service')],
      [Markup.button.callback('🗂️ سرویس‌های من', 'my_services')],
      [
        Markup.button.callback('💰 کیف پول', 'wallet'),
        Markup.button.callback('💬 پشتیبانی', 'support')
      ]
    ]);
    await ctx.reply(welcomeMessage, keyboard);
  });

  // Back to Main Menu Action
  bot.action('main_menu', async (ctx) => {
    const welcomeMessage = `چه کاری براتون انجام بدم؟`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🛍️ خرید سرویس', 'buy_service')],
      [Markup.button.callback('🗂️ سرویس‌های من', 'my_services')],
      [
        Markup.button.callback('💰 کیف پول', 'wallet'),
        Markup.button.callback('💬 پشتیبانی', 'support')
      ]
    ]);
    await ctx.editMessageText(welcomeMessage, keyboard);
  });


  // --- Purchase Flow ---
  bot.action('buy_service', async (ctx) => {
    const categories = await getActiveCategories();
    const buttons = categories.map(cat => Markup.button.callback(cat.name, `select_category_${cat.id}`));
    const keyboard = Markup.inlineKeyboard([
        ...buttons.map(b => [b]), 
        [Markup.button.callback(' بازگشت', 'main_menu')]
    ]);
    await ctx.editMessageText('لطفاً دسته‌بندی سرویس مورد نظر را انتخاب کنید:', keyboard);
  });

  bot.action(/select_category_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    const plans = await getPlansByCategoryId(categoryId);
    
    if (plans.length === 0) {
        await ctx.answerCbQuery('متاسفانه در این دسته پلنی برای فروش وجود ندارد.');
        return;
    }

    const buttons = plans.map(plan => Markup.button.callback(`${plan.name} (${plan.price.toLocaleString('fa-IR')} تومان)`, `select_plan_${plan.id}`));
    const keyboard = Markup.inlineKeyboard([
        ...buttons.map(b => [b]),
        [Markup.button.callback(' بازگشت', 'buy_service')]
    ]);
    await ctx.editMessageText('پلن مورد نظر را انتخاب کنید:', keyboard);
  });
  
  bot.action(/select_plan_(.+)/, async (ctx) => {
    const planId = ctx.match[1];
    const plan = mockData.plans.find(p => p.id === planId);
    if (!plan) {
        await ctx.answerCbQuery('پلن مورد نظر یافت نشد!');
        return;
    }
    
    // In a real app, you would deduct from wallet and create the service here.
    // We just simulate success.
    
    await ctx.editMessageText(`✅ خرید شما با موفقیت انجام شد!\n\nپلن: ${plan.name}\nمبلغ: ${plan.price.toLocaleString('fa-IR')} تومان\n\nاز خرید شما متشکریم.`);
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(' بازگشت به منوی اصلی', 'main_menu')]
    ]);
    await ctx.reply('برای ادامه، از دکمه زیر استفاده کنید:', keyboard);
  });


  // --- My Services Flow ---
  bot.action('my_services', async (ctx) => {
    const user = await findUserByTelegramId(ctx.from.id);
    if (!user || !user.id) {
        await ctx.answerCbQuery('کاربر یافت نشد!');
        return;
    }
    const services = await getUserServices(user.id);
    let message = 'سرویس‌های فعال شما:\n\n';
    if (services.length === 0) {
        message = 'شما در حال حاضر هیچ سرویس فعالی ندارید.';
    } else {
        services.forEach(s => {
            message += `🔹 **سرویس:** ${s.planName}\n`;
            message += `   **شناسه:** \`${s.clientEmail}\`\n`;
            message += `   **انقضا:** ${new Date(s.expiresAt).toLocaleDateString('fa-IR')}\n\n`;
        });
    }
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(' بازگشت', 'main_menu')]
    ]);
    await ctx.editMessageText(message, { ...keyboard, parse_mode: 'Markdown' });
  });

  // --- Wallet Flow ---
  bot.action('wallet', async (ctx) => {
      const user = await findUserByTelegramId(ctx.from.id);
      if(!user) {
           await ctx.answerCbQuery('کاربر یافت نشد!');
           return;
      }
      const balance = user.walletBalance || 0;
      const message = `💰 موجودی کیف پول شما: **${balance.toLocaleString('fa-IR')} تومان**`;
       const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(' بازگشت', 'main_menu')]
        ]);
      await ctx.editMessageText(message, { ...keyboard, parse_mode: 'Markdown'});
  });

  // --- Support Flow ---
  bot.action('support', async (ctx) => {
      const message = 'برای ارسال تیکت پشتیبانی، لطفاً از دستور /newticket استفاده کنید یا روی دکمه زیر کلیک کنید.';
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📝 ارسال تیکت جدید', 'new_ticket_action')],
        [Markup.button.callback(' بازگشت', 'main_menu')]
      ]);
      await ctx.editMessageText(message, keyboard);
  });
  
  const newTicketActionHandler = async (ctx: MyContext) => {
      ctx.session.step = 'awaiting_ticket_subject';
      ctx.session.ticketData = { department: 'GENERAL', priority: 'MEDIUM' }; // Default values
      await ctx.reply('لطفاً موضوع تیکت خود را در یک پیام ارسال کنید:');
      if (ctx.callbackQuery) await ctx.answerCbQuery();
  };

  bot.command('newticket', newTicketActionHandler);
  bot.action('new_ticket_action', newTicketActionHandler);


  // --- Message Listener for Support Flow ---
  bot.on(message('text'), async (ctx) => {
    if (ctx.session.step === 'awaiting_ticket_subject') {
        ctx.session.ticketData.subject = ctx.message.text;
        ctx.session.step = 'awaiting_ticket_message';
        await ctx.reply('عالی! حالا لطفاً مشکل خود را به صورت کامل شرح دهید:');
    } else if (ctx.session.step === 'awaiting_ticket_message') {
        const ticketId = `TG-${Date.now()}`;
        
        // In a real app, you would save the ticket to the database here
        console.log("New Ticket to be saved:", {
            id: ticketId,
            userId: `tg-${ctx.from.id}`,
            ...ctx.session.ticketData,
            message: ctx.message.text
        });

        await ctx.reply(`✅ تیکت شما با موفقیت ثبت شد.\nشماره پیگیری: \`${ticketId}\`\nکارشناسان ما به زودی پاسخ خواهند داد.`);
        
        // Reset session
        ctx.session.step = null;
        ctx.session.ticketData = {};

        // Show main menu again
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('بازگشت به منوی اصلی', 'main_menu')]
        ]);
        await ctx.reply('برای ادامه از منو استفاده کنید:', keyboard);
    } else {
         // Default reply if not in a specific flow
        await ctx.reply('برای استفاده از ربات، لطفاً از دکمه‌های منو یا دستور /start استفاده کنید.');
    }
  });


} else {
    console.warn("Telegram bot is not initialized because TELEGRAM_BOT_TOKEN is missing.");
}


// --- Webhook Setup for Production ---

export const handleUpdate = async (update: any, botInstance: Telegraf<any>) => {
    if (!botInstance) return;
    try {
        await botInstance.handleUpdate(update);
    } catch (error) {
        console.error('Error handling update in bot.ts:', error);
    }
};

export const setWebhook = async (url: string, botInstance: Telegraf<any>) => {
    if (!botInstance) {
      console.error("Bot is not initialized. Cannot set webhook.");
      return { success: false, error: "Bot is not initialized." };
    }
    const webhookUrl = `${url}/api/telegram/webhook`;
    try {
        const result = await botInstance.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to ${webhookUrl}`, result);
        return { success: true, url: webhookUrl };
    } catch (error) {
        console.error('Error setting webhook:', error);
        return { success: false, error };
    }
};
