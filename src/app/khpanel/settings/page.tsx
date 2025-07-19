
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ACCOUNTS_STORAGE_KEY, PANEL_SETTINGS_STORAGE_KEY } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Lock, Settings as SettingsIcon } from 'lucide-react';
import type { PanelSettings } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { user, accounts, setAccounts, panelSettings, setPanelSettings } = useAuth();
  const { toast } = useToast();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  const [currentPanelSettings, setCurrentPanelSettings] = React.useState<PanelSettings>({ panelName: '', isSignupEnabled: true });
  
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    if (panelSettings) {
      setCurrentPanelSettings(panelSettings);
    }
  }, [user, panelSettings]);

  const handleUpdateProfile = () => {
    if (!user) return;

    if (email !== user.email && accounts.some(acc => acc.email === email)) {
      toast({ title: 'خطا', description: 'این ایمیل توسط کاربر دیگری استفاده می‌شود.', variant: 'destructive' });
      return;
    }

    const updatedAccounts = accounts.map(acc => 
      acc.id === user.id ? { ...acc, name, email } : acc
    );
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

    toast({ title: 'موفقیت', description: 'اطلاعات پروفایل شما با موفقیت به‌روز شد.' });
  };

  const handleChangePassword = () => {
    if (!user) return;

    if (user.password !== currentPassword) {
      toast({ title: 'خطا', description: 'رمز عبور فعلی شما صحیح نیست.', variant: 'destructive' });
      return;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: 'خطا', description: 'رمز عبور جدید و تکرار آن مطابقت ندارند.', variant: 'destructive' });
      return;
    }

    const updatedAccounts = accounts.map(acc => 
      acc.id === user.id ? { ...acc, password: newPassword } : acc
    );
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

    toast({ title: 'موفقیت', description: 'رمز عبور شما با موفقیت تغییر کرد.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const handleSavePanelSettings = () => {
    if (!currentPanelSettings.panelName) {
        toast({ title: 'خطا', description: 'نام پنل نمی‌تواند خالی باشد.', variant: 'destructive' });
        return;
    }
    setPanelSettings(currentPanelSettings);
    localStorage.setItem(PANEL_SETTINGS_STORAGE_KEY, JSON.stringify(currentPanelSettings));
    toast({ title: 'موفقیت', description: 'تنظیمات پنل با موفقیت ذخیره شد.' });
  }
  
  if (!user) {
    return <div>در حال بارگذاری اطلاعات...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">تنظیمات پنل</h1>
        <p className="text-muted-foreground">
          پروفایل کاربری و تنظیمات کلی پنل خود را مدیریت کنید.
        </p>
      </div>
      <Separator />

      {(user.role === 'admin' || user.role === 'superadmin') && (
         <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                تنظیمات عمومی پنل
              </CardTitle>
              <CardDescription>تنظیمات کلی مربوط به ظاهر و عملکرد پنل را مدیریت کنید.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="panel-name">نام پنل</Label>
                <Input 
                  id="panel-name" 
                  value={currentPanelSettings.panelName} 
                  onChange={(e) => setCurrentPanelSettings(prev => ({ ...prev, panelName: e.target.value }))} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="signup-switch" className="font-semibold">فعال‌سازی صفحه ثبت‌نام</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    به کاربران جدید اجازه دهید در سیستم حساب کاربری بسازند.
                  </p>
                </div>
                <Switch 
                  id="signup-switch"
                  checked={currentPanelSettings.isSignupEnabled}
                  onCheckedChange={(checked) => setCurrentPanelSettings(prev => ({ ...prev, isSignupEnabled: checked }))}
                  dir="ltr"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSavePanelSettings}>ذخیره تنظیمات</Button>
            </CardFooter>
          </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            پروفایل کاربری
          </CardTitle>
          <CardDescription>اطلاعات حساب کاربری خود را ویرایش کنید.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleUpdateProfile}>ذخیره پروفایل</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <Lock className="h-5 w-5" />
             تغییر رمز عبور
          </CardTitle>
          <CardDescription>برای امنیت بیشتر، رمز عبور خود را به صورت دوره‌ای تغییر دهید.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">رمز عبور فعلی</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">رمز عبور جدید</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleChangePassword}>تغییر رمز عبور</Button>
        </CardFooter>
      </Card>
      
    </div>
  );
}
