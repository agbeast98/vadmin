
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Info, CheckCircle, ArrowLeft, Star, Phone, PlusCircle, Bot, Server, UserCog, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AboutSettingsPage() {
  const { user } = useAuth();
  
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <div>شما اجازه دسترسی به این صفحه را ندارید.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">درباره پنل و تعرفه‌ها</h1>
            <p className="text-muted-foreground">
              اطلاعات کامل در مورد امکانات، نسخه‌ها و قیمت‌گذاری پنل مدیریتی.
            </p>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="flex flex-col border-primary/50 ring-2 ring-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="text-primary"/>
                    نسخه پایه پنل
                </CardTitle>
                <CardDescription>
                    ایده‌آل برای شروع و مدیریت کسب‌وکارهای کوچک تا متوسط.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" /> <span>مدیریت کامل کاربران و سرویس‌ها</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" /> <span>ساخت و مدیریت پلن و دسته‌بندی</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" /> <span>سیستم تیکتینگ پیشرفته</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" /> <span>مدیریت مالی و کدهای تخفیف</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" /> <strong>شامل اتصال به ۱ پنل (مثل X-UI)</strong></li>
                </ul>
                <div className="pt-4 text-center">
                    <p className="text-3xl font-bold">$12</p>
                    <p className="text-muted-foreground text-sm">/ ماهانه</p>
                </div>
            </CardContent>
        </Card>

        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="text-primary"/>
                    افزونه‌های قابل فعال‌سازی
                </CardTitle>
                <CardDescription>
                    پنل خود را با افزودن امکانات بیشتر، قدرتمندتر کنید.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                 <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                    <span className="flex items-center gap-2"><Server className="w-4 h-4 text-muted-foreground"/> اتصال هر پنل اضافه</span>
                    <span className="font-bold text-primary">$2 / ماهانه</span>
                 </div>
                 <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                    <span className="flex items-center gap-2"><UserCog className="w-4 h-4 text-muted-foreground"/> فعال‌سازی پنل نمایندگان</span>
                    <span className="font-bold text-primary">$5 / ماهانه</span>
                 </div>
                 <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                    <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-muted-foreground"/> اتصال ربات تلگرام</span>
                    <span className="font-bold text-primary">$5 / ماهانه</span>
                 </div>
                 <div className="flex items-center justify-between text-sm p-3 rounded-md bg-muted/50">
                    <span className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground"/> هر ۱۰۰ کاربر اضافه</span>
                    <span className="font-bold text-primary">$1 / ماهانه</span>
                 </div>
            </CardContent>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>نسخه خصوصی (سورس کامل)</CardTitle>
              <CardDescription>
                برای کسب‌وکارهای بزرگ با نیازهای سفارشی، برندینگ کامل و بدون محدودیت ماهانه.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 text-sm list-disc pl-5">
                    <li>دریافت کامل سورس‌کد پنل و استقرار روی سرور شخصی شما.</li>
                    <li>بدون هیچ‌گونه هزینه ماهانه و محدودیت در تعداد کاربر یا پنل.</li>
                    <li>دامنه و برندینگ کاملاً اختصاصی شما.</li>
                    <li>امکان توسعه ماژول‌های سفارشی و API اختصاصی.</li>
                </ul>
            </CardContent>
          </Card>
       </div>

       <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5"/> اطلاعات تماس و مشاوره</CardTitle>
          <CardDescription>
            برای خرید، مشاوره یا دریافت نسخه خصوصی، از طریق تلگرام با ما در تماس باشید.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p><strong>پشتیبانی تلگرام:</strong> <a href="https://t.me/your_telegram_id" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@Your_Telegram_ID</a></p>
        </CardContent>
      </Card>
    </div>
  );
}

