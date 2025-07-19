
import {NextRequest, NextResponse} from 'next/server';
import { bot, setWebhook } from '@/lib/bot';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!bot) {
    return new NextResponse('Bot is not initialized. Cannot register webhook.', { status: 500 });
  }

  if (!appUrl) {
    return new NextResponse('NEXT_PUBLIC_APP_URL environment variable is not set.', { status: 500 });
  }

  const result = await setWebhook(appUrl, bot);

  if (result.success) {
    return NextResponse.json({ message: `Webhook successfully set to ${result.url}` });
  } else {
    return new NextResponse(`Failed to set webhook: ${result.error}`, { status: 500 });
  }
}
