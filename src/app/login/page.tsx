
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Trash2, ShieldAlert } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setSession } from '@/lib/data-service';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, accounts, isLoading, handleRedirect } = useAuth();
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  React.useEffect(() => {
    if (!isLoading && accounts.length === 0) {
        router.push('/setup');
    }
  }, [isLoading, accounts, router]);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
        handleRedirect();
    }
  }, [isLoading, isAuthenticated, handleRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.length === 0) {
        toast({ title: 'خطا', description: 'سیستم آماده نیست. لطفاً لحظاتی بعد تلاش کنید.', variant: 'destructive' });
        return;
    }

    const foundUser = accounts.find(acc => acc.email === email);

    if (foundUser && foundUser.password === password) {
      if (foundUser.status === 'active') {
        await setSession(foundUser);
        toast({ title: 'موفقیت‌آمیز', description: 'شما با موفقیت وارد شدید.' });
        router.refresh(); // Refresh to re-trigger auth checks and redirects
        router.push('/khpanel/dashboard');
      } else {
         toast({ title: 'خطا در ورود', description: 'حساب کاربری شما غیرفعال است.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'خطا در ورود', description: 'ایمیل یا رمز عبور وارد شده صحیح نیست.', variant: 'destructive' });
    }
  };

  const handleResetDatabase = () => {
    // This is a client-side action for development and should not be a server action
    // In a real app, this would be a protected server action.
    // For now, it just clears local/session storage which is no longer the main DB.
    // To truly reset, the user needs to delete the `_data` directory.
    try {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
        toast({
            title: "توجه",
            description: "برای ریست کامل، پوشه `_data` را در ریشه پروژه حذف و برنامه را ری‌استارت کنید.",
            duration: 8000
        });
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } catch(e) {
        toast({
            title: "خطا",
            description: "مشکلی در پاکسازی حافظه مرورگر رخ داد.",
            variant: "destructive",
        });
    }
  }

  if (isLoading || isAuthenticated || accounts.length === 0) {
    return <div className="flex h-screen w-full items-center justify-center">در حال بارگذاری...</div>;
  }
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <LogIn className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">ورود به پنل مدیریت</CardTitle>
          <CardDescription className="text-center">برای ورود به حساب کاربری، اطلاعات خود را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input id="email" type="email" placeholder="admin@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">رمز عبور</Label>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                ورود
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            حساب کاربری ندارید؟{' '}
            <Link href={`/signup`} className="underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 right-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="ml-2 h-4 w-4" />
                  ریست کردن پنل
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    <ShieldAlert className="inline-block text-destructive ml-2" />
                    آیا کاملاً مطمئن هستید؟
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    این عملیات داده‌های حافظه مرورگر را پاک می‌کند. برای ریست کامل و واقعی، شما باید پوشه `_data` را در سرور حذف کرده و برنامه را مجدداً راه‌اندازی کنید.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetDatabase} className="bg-destructive hover:bg-destructive/90">
                    متوجه‌ام، ادامه بده
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
  );
}
