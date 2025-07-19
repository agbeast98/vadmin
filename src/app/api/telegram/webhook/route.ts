
import {NextRequest, NextResponse} from 'next/server';
import { bot, handleUpdate } from '@/lib/bot';

export async function POST(req: NextRequest) {
  if (!bot) {
    console.error("Bot not initialized in webhook");
    return new NextResponse('Bot not initialized', { status: 500 });
  }
  try {
    const body = await req.json();
    await handleUpdate(body, bot); // Pass the bot instance
    return NextResponse.json({status: 'ok'});
  } catch (error) {
    console.error('Error in Telegram webhook:', error);
    return new NextResponse('Error handling webhook', {status: 500});
  }
}
