
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, CreditCard, Users as UsersIcon, Server, Ticket, DollarSign, ShoppingBag, ArrowUp, ArrowDown, Users2, CalendarDays, Layers3, Wallet, HandCoins } from 'lucide-react';
import type { Account, Plan, Service, Ticket as TicketType, TicketPriority, TicketStatus, TopUpRequest } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PLANS_STORAGE_KEY, SERVICES_STORAGE_KEY, TICKETS_STORAGE_KEY, TOP_UP_REQUESTS_STORAGE_KEY } from '@/lib/constants';
import { subDays, startOfDay, endOfDay, isWithinInterval, startOfToday, format, isSameDay, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Maps for ticket display
const priorityMap: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: 'پایین', className: 'bg-blue-500 hover:bg-blue-500/80' },
  MEDIUM: { label: 'متوسط', className: 'bg-yellow-500 hover:bg-yellow-500/80' },
  HIGH: { label: 'بالا', className: 'bg-red-500 hover:bg-red-500/80' },
};
const statusMap: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: 'باز', className: 'bg-green-600 hover:bg-green-600/80' },
  IN_PROGRESS: { label: 'در حال بررسی', className: 'bg-yellow-500 hover:bg-yellow-500/80' },
  CLOSED: { label: 'بسته شده', className: 'bg-gray-500 hover:bg-gray-500/80' },
};


export default function DashboardPage() {
  const { user, accounts, panelSettings } = useAuth();
  
  // Admin states
  const [revenueToday, setRevenueToday] = React.useState(0);
  const [salesToday, setSalesToday] = React.useState(0);
  const [openTicketsCount, setOpenTicketsCount] = React.useState(0);
  const [newUsersThisWeek, setNewUsersThisWeek] = React.useState(0);
  const [remainingDays, setRemainingDays] = React.useState<number | string>('نامحدود');
  const [serviceCount, setServiceCount] = React.useState(0);
  const [pendingTopUpCount, setPendingTopUpCount] = React.useState(0);
  const [recentServices, setRecentServices] = React.useState<Service[]>([]);
  const [urgentTickets, setUrgentTickets] = React.useState<TicketType[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);

  // User/Agent states
  const [userActiveServices, setUserActiveServices] = React.useState(0);
  const [userTotalServices, setUserTotalServices] = React.useState(0);
  const [userOpenTicketsCount, setUserOpenTicketsCount] = React.useState(0);
  
  // Common states
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const getFinalPrice = (service: Service, allPlans: Plan[]) => {
      const plan = allPlans.find(p => p.id === service.planId);
      return service.finalPrice !== undefined ? service.finalPrice : (plan?.price || 0);
  }

  React.useEffect(() => {
    if (!user) return;

    try {
      const storedServicesStr = localStorage.getItem(SERVICES_STORAGE_KEY);
      const storedPlansStr = localStorage.getItem(PLANS_STORAGE_KEY);
      const storedTicketsStr = localStorage.getItem(TICKETS_STORAGE_KEY);
      const storedTopUpsStr = localStorage.getItem(TOP_UP_REQUESTS_STORAGE_KEY);

      const allServices: Service[] = (storedServicesStr ? JSON.parse(storedServicesStr) : []);
      const allPlans: Plan[] = (storedPlansStr ? JSON.parse(storedPlansStr) : []);
      const allTickets: TicketType[] = (storedTicketsStr ? JSON.parse(storedTicketsStr) : []);
      const allTopUps: TopUpRequest[] = (storedTopUpsStr ? JSON.parse(storedTopUpsStr) : []);
      
      setPlans(allPlans);
      const now = new Date();

      if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'supporter') {
        const today = startOfToday();
        
        // Calculate license remaining days
        if (panelSettings.licenseExpiresAt) {
            const days = differenceInDays(new Date(panelSettings.licenseExpiresAt), new Date());
            setRemainingDays(days >= 0 ? days : 'منقضی شده');
        } else {
            setRemainingDays('نامحدود');
        }

        // Calculate service count
        setServiceCount(allServices.length);

        // Calculate pending top-up requests
        setPendingTopUpCount(allTopUps.filter(r => r.status === 'pending').length);
        
        // Calculate Today's revenue & sales
        const todayServices = allServices.filter(s => isSameDay(new Date(s.createdAt), today));
        setRevenueToday(todayServices.reduce((acc, s) => acc + getFinalPrice(s, allPlans), 0));
        setSalesToday(todayServices.length);

        // Open Tickets
        setOpenTicketsCount(allTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length);
        
        // New users this week
        const oneWeekAgo = subDays(now, 7);
        const normalUsers = (accounts || []).filter(acc => acc.role === 'user');
        setNewUsersThisWeek(normalUsers.filter(acc => new Date(acc.createdAt) >= oneWeekAgo).length);
        
        // Recent Services
        setRecentServices(allServices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
        
        // Urgent Tickets
        setUrgentTickets(allTickets.filter(t => t.priority === 'HIGH' && t.status !== 'CLOSED').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5));
        
        // Chart Data for last 30 days
        const last30DaysData = Array.from({ length: 30 }).map((_, i) => {
            const date = subDays(today, 29 - i);
            const dailyRevenue = allServices
                .filter(s => isSameDay(new Date(s.createdAt), date))
                .reduce((acc, s) => acc + getFinalPrice(s, allPlans), 0);
            return {
                date: format(date, 'MM/dd'),
                درآمد: dailyRevenue,
            };
        });
        setChartData(last30DaysData);

      } else {
        // User/Agent Data
        const userServices = allServices.filter(s => s.userId === user.id);
        setUserActiveServices(userServices.filter(s => new Date(s.expiresAt) > now).length);
        setUserTotalServices(userServices.length);
        setRecentServices(userServices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
        
        // User's open tickets
        const userTickets = allTickets.filter(t => t.userId === user.id);
        setUserOpenTicketsCount(userTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length);
      }

    } catch (error) {
      console.error("Failed to load dashboard data from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, accounts, panelSettings]);

  const getAccount = (accountId: string) => (accounts || []).find(a => a.id === accountId);
  const getPlan = (planId: string) => plans.find(p => p.id === planId);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  if (isLoading || !user) {
    return <div>در حال بارگذاری اطلاعات داشبورد...</div>
  }
  
  const renderAdminDashboard = () => {
    const isLicenseExpiring = typeof remainingDays === 'number' && remainingDays < 7;
    const isServiceLimitApproaching = panelSettings.totalServiceLimit && serviceCount >= panelSettings.totalServiceLimit * 0.9;
    const isFullAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isFullAdmin && (
          <>
            <Card className={cn("xl:col-span-2", isLicenseExpiring && 'border-destructive')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-sm font-medium", isLicenseExpiring && 'text-destructive')}>اعتبار پنل</CardTitle>
                <CalendarDays className={cn("h-4 w-4 text-muted-foreground", isLicenseExpiring && 'text-destructive')} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", isLicenseExpiring && 'text-destructive')}>
                  {remainingDays} {typeof remainingDays === 'number' && 'روز'}
                </div>
                <p className="text-xs text-muted-foreground">روزهای باقی‌مانده از لایسنس پنل</p>
              </CardContent>
            </Card>
             <Card className={cn("xl:col-span-2", isServiceLimitApproaching && 'border-destructive')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-sm font-medium", isServiceLimitApproaching && 'text-destructive')}>تعداد سرویس‌ها</CardTitle>
                <Layers3 className={cn("h-4 w-4 text-muted-foreground", isServiceLimitApproaching && 'text-destructive')} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", isServiceLimitApproaching && 'text-destructive')}>
                  {serviceCount} / {panelSettings.totalServiceLimit ?? '∞'}
                </div>
                <p className="text-xs text-muted-foreground">تعداد سرویس‌های ساخته شده در پنل</p>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فروش امروز</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{salesToday}</div>
            <p className="text-xs text-muted-foreground">سفارش‌های ثبت شده امروز</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران جدید</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newUsersThisWeek}</div>
            <p className="text-xs text-muted-foreground">ثبت‌نامی‌های ۷ روز اخیر</p>
          </CardContent>
        </Card>
        <Link href="/khpanel/financial/top-up-requests" className={cn("block", isFullAdmin ? "xl:col-span-3" : "lg:col-span-1 xl:col-span-3")}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">درخواست‌های شارژ</CardTitle>
              <HandCoins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTopUpCount}</div>
              <p className="text-xs text-muted-foreground">تعداد درخواست‌های در انتظار تایید</p>
            </CardContent>
          </Card>
        </Link>
         <Link href="/khpanel/tickets" className={cn("block", isFullAdmin ? "xl:col-span-3" : "lg:col-span-1 xl:col-span-3")}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تیکت‌های باز</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openTicketsCount}</div>
                <p className="text-xs text-muted-foreground">تعداد تیکت‌های در انتظار پاسخ</p>
              </CardContent>
            </Card>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-5">
        {isFullAdmin && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>نمودار درآمد ۳۰ روز گذشته</CardTitle>
              <CardDescription>نمایش روند فروش در یک ماه اخیر.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`} />
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    formatter={(value: number) => [`${formatCurrency(value)} تومان`, "درآمد"]}
                  />
                  <Area type="monotone" dataKey="درآمد" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <Card className={cn(isFullAdmin ? "lg:col-span-2" : "lg:col-span-5")}>
            <CardHeader>
                <CardTitle>آخرین سفارش‌ها</CardTitle>
                <CardDescription>۵ سفارش آخر ثبت شده در سیستم.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>کاربر</TableHead>
                            <TableHead className="text-left">مبلغ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentServices.length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center h-24">سفارشی ثبت نشده.</TableCell></TableRow>
                        ) : (
                            recentServices.map(service => {
                                const account = getAccount(service.userId);
                                return (
                                <TableRow key={service.id}>
                                    <TableCell>
                                        <div className="font-medium">{account?.name || 'کاربر حذف شده'}</div>
                                        <div className="hidden text-sm text-muted-foreground md:inline">{getPlan(service.planId)?.name || ''}</div>
                                    </TableCell>
                                    <TableCell className="text-left font-medium">{formatCurrency(getFinalPrice(service, plans))} تومان</TableCell>
                                </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>تیکت‌های با اولویت بالا</CardTitle>
                    <CardDescription>تیکت‌های فوری که نیاز به پاسخ سریع دارند.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/khpanel/tickets`}>
                        مشاهده همه تیکت‌ها
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>موضوع</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead className="text-left">آخرین بروزرسانی</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {urgentTickets.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">تیکت فوری بازی وجود ندارد.</TableCell></TableRow>
                        ) : (
                            urgentTickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                    <TableCell>
                                        <Link href={`/khpanel/tickets/${encodeURIComponent(ticket.id)}`} className="font-medium hover:underline">
                                            {ticket.subject}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${statusMap[ticket.status].className} text-white`}>{statusMap[ticket.status].label}</Badge>
                                    </TableCell>
                                    <TableCell className="text-left">{new Date(ticket.updatedAt).toLocaleString('fa-IR')}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
      </div>
    </>
    )
  };

  const renderUserDashboard = () => (
    <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">سرویس‌های فعال شما</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userActiveServices}</div>
                    <p className="text-xs text-muted-foreground">تعداد سرویس‌های فعال شما</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">کل سرویس‌های شما</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userTotalServices}</div>
                    <p className="text-xs text-muted-foreground">تعداد کل سرویس‌هایی که خریداری کرده‌اید</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تیکت‌های باز</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userOpenTicketsCount}</div>
                    <p className="text-xs text-muted-foreground">تیکت‌های در انتظار پاسخ شما</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">موجودی کیف پول</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(user?.walletBalance || 0)} <span className="text-sm text-muted-foreground">تومان</span></div>
                    <p className="text-xs text-muted-foreground">موجودی فعلی حساب شما</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>خریدهای اخیر</CardTitle>
                <CardDescription>
                    مروری بر آخرین سرویس‌هایی که شما خریداری کرده‌اید.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>طرح سرویس</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ خرید</TableHead>
                      <TableHead className="text-right">مبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                           هنوز هیچ سرویسی ایجاد نشده است.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentServices.map(service => {
                        const plan = getPlan(service.planId);
                        const isExpired = new Date(service.expiresAt) < new Date();
                        return (
                            <TableRow key={service.id}>
                                <TableCell>{plan?.name || 'پلن حذف شده'}</TableCell>
                                <TableCell>
                                    {isExpired ? (
                                        <Badge variant="destructive">منقضی شده</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{new Date(service.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                                <TableCell className="text-right">{formatCurrency(getFinalPrice(service, plans))} تومان</TableCell>
                            </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      {(user.role === 'admin' || user.role === 'superadmin' || user.role === 'supporter') ? renderAdminDashboard() : renderUserDashboard()}
    </div>
  );
}
