
import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import type { Plan, PanelSettings } from '@/lib/types';
import { readData } from '@/lib/data-service';
import * as C from '@/lib/constants';

async function getPricingData() {
  const allPlans = await readData<Plan[]>(C.PLANS_STORAGE_KEY, []);
  const panelSettings = await readData<PanelSettings>(C.PANEL_SETTINGS_STORAGE_KEY, { panelName: 'V-Admin Panel', isSignupEnabled: true });
  const activePlans = allPlans.filter((p: Plan) => p.status === 'active');
  return { plans: activePlans, panelSettings };
}

export default async function PricingPage() {
  const { plans, panelSettings } = await getPricingData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };
  
  const getDurationText = (days: number) => {
    if (days >= 365) return `${Math.floor(days/365)} ساله`;
    if (days >= 30) return `${Math.floor(days/30)} ماهه`;
    return `${days} روزه`;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <span className="font-bold text-lg">{panelSettings.panelName}</span>
        </Link>
        <nav className="mr-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            <Button>ورود به پنل کاربری</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/20">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                پلن‌های فروش ما
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                بهترین سرویس متناسب با نیاز خود را انتخاب کنید و همین حالا شروع کنید.
              </p>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            {plans.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    در حال حاضر هیچ پلن فعالی برای نمایش وجود ندارد.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col">
                      <CardHeader className="pb-4">
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{`سرویس ${getDurationText(plan.durationDays)} با بهترین کیفیت`}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-grow">
                         <div className="my-4 text-center">
                            <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                            <span className="text-sm text-muted-foreground"> تومان</span>
                         </div>
                         <ul className="space-y-3 flex-grow">
                             <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>{`اعتبار ${plan.durationDays} روزه`}</span>
                             </li>
                             {plan.volumeGB && (
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>{`${plan.volumeGB} گیگابایت حجم`}</span>
                                </li>
                             )}
                              <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span>پشتیبانی کامل</span>
                             </li>
                         </ul>
                         <Button asChild className="mt-6 w-full">
                            <Link href="/signup">
                                خرید و فعالسازی
                                <ArrowLeft className="mr-2 h-4 w-4" />
                            </Link>
                         </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            )}
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {panelSettings.panelName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
