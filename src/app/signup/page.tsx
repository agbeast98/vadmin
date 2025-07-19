
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Account } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { addAccount, setSession } from '@/lib/data-service';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, accounts, panelSettings, isLoading } = useAuth();
  
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Redirect if user is already logged in or signup is disabled
  React.useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.push(`/khpanel`);
      return;
    }

    if (!panelSettings.isSignupEnabled) {
      toast({
        title: 'ثبت‌نام غیرفعال است',
        description: 'در حال حاضر امکان ثبت‌نام کاربر جدید وجود ندارد.',
        variant: 'destructive',
      });
      router.push('/login');
    }
  }, [isAuthenticated, router, panelSettings, isLoading, toast]);
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'خطا',
        description: 'رمزهای عبور با یکدیگر مطابقت ندارند.',
        variant: 'destructive',
      });
      return;
    }
    
    if (accounts.find(acc => acc.email === email)) {
      toast({
        title: 'خطا',
        description: 'این ایمیل قبلاً در سیستم ثبت شده است.',
        variant: 'destructive',
      });
      return;
    }

    const newUser: Account = {
      id: `user-${new Date().toISOString()}`,
      name,
      email,
      password: password,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    const result = await addAccount(newUser);

    if (result.success) {
      await setSession(newUser);
      toast({
        title: 'ثبت‌نام موفق',
        description: 'حساب کاربری شما با موفقیت ایجاد شد و وارد شدید.',
      });
      router.refresh();
      router.push('/khpanel');
    } else {
      toast({
        title: 'خطای سیستمی',
        description: result.error || 'مشکلی در فرآیند ثبت‌نام رخ داده است.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || (panelSettings && !panelSettings.isSignupEnabled)) {
    return <div className="flex h-screen w-full items-center justify-center">در حال بارگذاری یا بررسی تنظیمات...</div>;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">ایجاد حساب کاربری</CardTitle>
          <CardDescription className="text-center">برای شروع، اطلاعات خود را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
               <div className="grid gap-2">
                <Label htmlFor="name">نام کامل</Label>
                <Input id="name" placeholder="مثلا: علی رضایی" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">رمز عبور</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                ایجاد حساب
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            قبلاً حساب کاربری ساخته‌اید؟{' '}
            <Link href={`/login`} className="underline">
              وارد شوید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
