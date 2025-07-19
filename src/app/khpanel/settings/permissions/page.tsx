
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import type { Account, Permissions } from '@/lib/types';
import { ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Bot, KeyRound, Server, UserCog, ShieldCheck, PackagePlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const permissionDetails: { key: keyof Permissions; label: string; icon: React.ElementType }[] = [
  { key: 'telegramBot', label: 'ربات تلگرام', icon: Bot },
  { key: 'panelAlireza', label: 'پنل علیرضا (X-UI)', icon: Server },
  { key: 'panelSanaei', label: 'پنل سنایی', icon: Server },
  { key: 'panelMarzban', label: 'پنل مرزبان', icon: Server },
  { key: 'panelShahan', label: 'پنل شاهان', icon: Server },
  { key: 'panelAgents', label: 'پنل نمایندگی', icon: UserCog },
  { key: 'premadeStock', label: 'موجودی آماده', icon: PackagePlus },
];

export default function PermissionsPage() {
  const { user, accounts, setAccounts } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Security check
  React.useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast({
        title: 'دسترسی غیرمجاز',
        description: 'شما اجازه مشاهده این صفحه را ندارید.',
        variant: 'destructive',
      });
      router.push('/khpanel/dashboard');
    }
  }, [user, router, toast]);

  const adminAccounts = React.useMemo(() => {
    return accounts.filter(acc => acc.role === 'admin');
  }, [accounts]);
  
  const handlePermissionChange = (adminId: string, permissionKey: keyof Permissions, value: boolean) => {
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === adminId) {
        return {
          ...acc,
          permissions: {
            ...acc.permissions,
            [permissionKey]: value,
          },
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    toast({
        title: "بروزرسانی موفق",
        description: `دسترسی مورد نظر با موفقیت تغییر کرد.`
    })
  };
  
  if (user?.role !== 'superadmin') {
      return <div className="flex h-screen items-center justify-center">در حال بررسی دسترسی...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">مدیریت دسترسی‌ها</h1>
            <p className="text-muted-foreground">
              دسترسی ادمین‌ها به بخش‌های مختلف سیستم را مدیریت کنید.
            </p>
          </div>
        </div>
      </div>
      <Separator />
      
      {adminAccounts.length === 0 ? (
        <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                هنوز هیچ ادمینی در سیستم تعریف نشده است.
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adminAccounts.map(admin => (
                <Card key={admin.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-5 w-5 text-primary"/> 
                           {admin.name}
                        </CardTitle>
                        <CardDescription>{admin.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {permissionDetails.map(p => (
                            <div key={p.key} className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor={`${admin.id}-${p.key}`} className="flex items-center gap-2">
                                    <p.icon className="h-4 w-4 text-muted-foreground" />
                                    {p.label}
                                </Label>
                                <Switch
                                    id={`${admin.id}-${p.key}`}
                                    checked={admin.permissions?.[p.key] ?? false}
                                    onCheckedChange={(value) => handlePermissionChange(admin.id, p.key, value)}
                                    dir="ltr"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
      )}

    </div>
  );
}
