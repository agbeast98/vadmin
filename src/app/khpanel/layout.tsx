
'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { UserNav } from '@/components/user-nav';
import { Search, Wallet, AlertTriangle, CalendarDays, Layers3 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { differenceInDays } from 'date-fns';
import { SERVICES_STORAGE_KEY } from '@/lib/constants';

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accounts, isAuthenticated, isLoading, logout, panelSettings } = useAuth();
  const [isLicenseExpired, setIsLicenseExpired] = React.useState(false);
  const [serviceCount, setServiceCount] = React.useState(0);
  
  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Check for panel-wide license expiration, but not for superadmin
    if (user.role !== 'superadmin' && panelSettings.licenseExpiresAt) {
      const expirationDate = new Date(panelSettings.licenseExpiresAt);
      if (expirationDate < new Date()) {
        setIsLicenseExpired(true);
      }
    }
    
    // Load service count for the footer display
    try {
        const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
        setServiceCount(storedServices ? JSON.parse(storedServices).length : 0);
    } catch (e) {
        console.error("Failed to load service count", e);
    }

  }, [isLoading, isAuthenticated, user, router, panelSettings]);
  
  if (isLoading || !isAuthenticated || !user) {
    return <div className="flex h-screen items-center justify-center">در حال بارگذاری و بررسی احراز هویت...</div>;
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '۰ تومان';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };
  
  const renderSidebarHeader = () => {
      return (
           <SidebarHeader className="p-4">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold text-sidebar-foreground">{panelSettings.panelName}</h1>
                  <p className="text-xs text-sidebar-foreground/70 -mt-1">پنل کاربری</p>
                </div>
              </div>
            </SidebarHeader>
      )
  }
  
 const renderSidebarFooter = () => {
    if (!user) return null;
    
    // For admin and superadmin, show license info
    if (user.role === 'admin' || user.role === 'superadmin') {
        let remainingDaysText = 'نامحدود';
        if (panelSettings.licenseExpiresAt) {
            const days = differenceInDays(new Date(panelSettings.licenseExpiresAt), new Date());
            remainingDaysText = days >= 0 ? `${days} روز` : 'منقضی شده';
        }
        
        const serviceLimitText = `${serviceCount} / ${panelSettings.totalServiceLimit ?? '∞'}`;
        
        return (
            <SidebarFooter className="flex-col gap-2 p-2">
                <Separator className="my-1" />
                <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/80">
                    <Layers3 className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                        <span>تعداد سرویس‌ها:</span>
                        <span className="font-bold text-sidebar-foreground">{serviceLimitText}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/80">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                        <span>اعتبار پنل:</span>
                        <span className="font-bold text-sidebar-foreground">{remainingDaysText}</span>
                    </div>
                </div>
            </SidebarFooter>
        )
    }

    // For other roles like 'user', 'agent', 'supporter'
    return (
        <SidebarFooter>
            <Separator className="my-2" />
            <div className="flex items-center gap-2 p-2 text-sm font-medium text-sidebar-foreground/80">
                <Wallet className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                    <span>موجودی کیف پول:</span>
                    <span className="font-bold text-sidebar-foreground">{formatCurrency(user.walletBalance)}</span>
                </div>
            </div>
        </SidebarFooter>
    )
  }

  const renderLicenseExpiredModal = () => (
    <Dialog open={isLicenseExpired} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
            <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center text-xl">لایسنس پنل منقضی شده است</DialogTitle>
                <DialogDescription className="text-center pt-2">
                    اعتبار لایسنس این پنل به پایان رسیده است. تمام قابلیت‌ها تا زمان تمدید توسط مدیر کل، غیرفعال می‌باشند. لطفاً با پشتیبانی تماس بگیرید.
                </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-center">
                 <Button onClick={logout} variant="destructive">خروج از حساب</Button>
            </div>
        </DialogContent>
    </Dialog>
  );

  return (
    <SidebarProvider>
      <Sidebar side="right" variant="sidebar" collapsible="icon">
        {renderSidebarHeader()}
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
        {renderSidebarFooter()}
      </Sidebar>
      <main className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-4 w-full">
            <SidebarTrigger className="hidden md:flex"/>
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="جستجو..."
                className="w-full rounded-lg bg-secondary pr-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <UserNav />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {isLicenseExpired ? renderLicenseExpiredModal() : children}
        </div>
      </main>
    </SidebarProvider>
  );
}

    