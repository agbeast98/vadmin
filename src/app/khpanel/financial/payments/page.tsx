
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function PaymentsPage() {

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Banknote className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">تاریخچه پرداختی‌ها</h1>
                    <p className="text-muted-foreground">
                        تمام تراکنش‌ها و پرداخت‌های موفق درگاه را در این بخش مشاهده کنید.
                    </p>
                </div>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>لیست پرداخت‌ها</CardTitle>
            </CardHeader>
            <CardContent>
                 <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>در دست ساخت!</AlertTitle>
                  <AlertDescription>
                    این صفحه برای مشاهده تاریخچه پرداخت‌های انجام شده توسط مشتریان شما در نظر گرفته شده است. این قابلیت در نسخه‌های آینده تکمیل خواهد شد.
                  </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    </div>
  );
}
