
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { PanelSettings } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { add, format } from 'date-fns';
import { CalendarIcon, Layers3, Save, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PANEL_SETTINGS_STORAGE_KEY } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

export default function LicensesPage() {
  const { user, panelSettings, setPanelSettings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = React.useState<PanelSettings>(panelSettings);
  const [extension, setExtension] = React.useState({ days: 0, months: 0, years: 0 });

  // Security check: Only superadmins can access this page
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
  
  React.useEffect(() => {
    setLocalSettings(panelSettings);
  }, [panelSettings]);

  const handleSaveSettings = () => {
    setPanelSettings(localSettings);
    localStorage.setItem(PANEL_SETTINGS_STORAGE_KEY, JSON.stringify(localSettings));
    toast({ title: 'موفقیت‌آمیز', description: 'تنظیمات لایسنس پنل با موفقیت به‌روز شد.' });
  };
  
  const handleExtendLicense = () => {
    const { days, months, years } = extension;
    if (days === 0 && months === 0 && years === 0) {
        toast({ title: 'خطا', description: 'لطفاً حداقل یک مقدار برای تمدید وارد کنید.', variant: 'destructive'});
        return;
    }

    const currentExpiry = localSettings.licenseExpiresAt ? new Date(localSettings.licenseExpiresAt) : new Date();
    const newExpiryDate = add(currentExpiry, { years, months, days });
    
    const updatedSettings = { ...localSettings, licenseExpiresAt: newExpiryDate.toISOString() };
    setLocalSettings(updatedSettings);
    setPanelSettings(updatedSettings);
    localStorage.setItem(PANEL_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    
    toast({ title: 'موفقیت‌آمیز', description: `اعتبار پنل تا تاریخ ${formatDate(newExpiryDate.toISOString())} تمدید شد.` });
    setExtension({ days: 0, months: 0, years: 0 });
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'نامحدود';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
    } catch {
      return 'نامعتبر';
    }
  };

  if (user?.role !== 'superadmin') {
    return <div className="flex h-screen items-center justify-center">در حال بررسی دسترسی...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <CalendarIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت لایسنس پنل</h1>
          <p className="text-muted-foreground">
            تاریخ انقضا و سقف سرویس‌های کل پنل را در این بخش مدیریت کنید.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>تمدید اعتبار پنل</CardTitle>
           <CardDescription>
            تاریخ انقضای فعلی پنل: <span className="font-bold text-primary">{formatDate(localSettings.licenseExpiresAt)}</span>
           </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="extend-days">روز</Label>
                <Input id="extend-days" type="number" value={extension.days || ''} onChange={e => setExtension(p => ({...p, days: Number(e.target.value)}))} placeholder="0"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="extend-months">ماه</Label>
                <Input id="extend-months" type="number" value={extension.months || ''} onChange={e => setExtension(p => ({...p, months: Number(e.target.value)}))} placeholder="0"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="extend-years">سال</Label>
                <Input id="extend-years" type="number" value={extension.years || ''} onChange={e => setExtension(p => ({...p, years: Number(e.target.value)}))} placeholder="0"/>
            </div>
          </div>
           <Button onClick={handleExtendLicense}>
            <PlusCircle className="ml-2 h-4 w-4"/>
             تمدید اعتبار
           </Button>
        </CardContent>
        
        <Separator className="my-4"/>

        <CardHeader>
            <CardTitle>تنظیمات محدودیت</CardTitle>
             <CardDescription>
                محدودیت‌های کلی پنل را در این بخش تنظیم کنید.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="total-service-limit" className="flex items-center gap-2">
                    <Layers3 className="w-4 h-4"/>
                    سقف کل سرویس‌ها
                </Label>
                <Input 
                    id="total-service-limit" 
                    type="number"
                    value={localSettings.totalServiceLimit || ''} 
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, totalServiceLimit: e.target.value === '' ? undefined : Number(e.target.value) }))} 
                    placeholder="نامحدود"
                    className="md:w-[280px]"
                />
                 <p className="text-xs text-muted-foreground">
                    حداکثر تعداد سرویس‌هایی که در کل سیستم می‌توان ساخت. برای نامحدود کردن، فیلد را خالی بگذارید.
                </p>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveSettings}>
                <Save className="ml-2 h-4 w-4" />
                ذخیره تنظیمات محدودیت
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
