
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
import { Search, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/');
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);
  
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
                  <h1 className="text-lg font-semibold text-sidebar-foreground">V-Admin Panel</h1>
                  <p className="text-xs text-sidebar-foreground/70 -mt-1">پنل کاربری</p>
                </div>
              </div>
            </SidebarHeader>
      )
  }
  
  const renderSidebarFooter = () => {
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
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
