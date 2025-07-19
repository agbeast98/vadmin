
'use client';

import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Account, Permissions } from '@/lib/types';
import { addAccount } from '@/lib/data-service';

const defaultPermissions: Permissions = {
  telegramBot: true,
  panelAlireza: true,
  panelSanaei: true,
  panelMarzban: true,
  panelShahan: true,
  panelAgents: true,
  premadeStock: true,
};

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { accounts, isLoading } = useAuth();
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isCheckingSetup, setIsCheckingSetup] = React.useState(true);

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    const hasBeenSetup = accounts.some(a => a.role === 'superadmin');
    if (hasBeenSetup) {
      toast({
        title: 'دسترسی غیرمجاز',
        description: 'سیستم قبلاً راه‌اندازی شده است. در حال انتقال به صفحه ورود...',
        variant: 'destructive'
      });
      router.push('/login');
    } else {
      setIsCheckingSetup(false);
    }
  }, [isLoading, accounts, router, toast]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'خطا',
        description: 'رمزهای عبور با یکدیگر مطابقت ندارند.',
        variant: 'destructive',
      });
      return;
    }
    
    const now = new Date().toISOString();
    const newAdmin: Account = {
      id: `superadmin-${now}`,
      name: 'ادمین کل',
      email,
      password,
      role: 'superadmin',
      status: 'active',
      createdAt: now,
      permissions: defaultPermissions,
    };
    
    const result = await addAccount(newAdmin);

    if (result.success) {
        toast({
            title: 'راه‌اندازی موفق',
            description: 'حساب ادمین کل با موفقیت ایجاد شد. لطفاً وارد شوید.',
        });
        router.push('/login');
    } else {
        toast({
            title: 'خطای سیستمی',
            description: result.error || 'مشکلی در فرآیند ایجاد ادمین رخ داده است.',
            variant: 'destructive',
        });
    }
  };
  
  if (isLoading || isCheckingSetup) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div>در حال بررسی وضعیت سیستم...</div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">راه‌اندازی اولیه سیستم</CardTitle>
          <CardDescription className="text-center">برای شروع، اولین حساب مدیر کل سیستم را ایجاد کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">ایمیل ادمین کل</Label>
                <Input id="email" type="email" placeholder="superadmin@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
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
                ایجاد ادمین کل و راه‌اندازی
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
