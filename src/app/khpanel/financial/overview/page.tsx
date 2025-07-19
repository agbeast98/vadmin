
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ShoppingBag, CandlestickChart } from 'lucide-react';
import type { Service, Plan, Expense } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SERVICES_STORAGE_KEY, PLANS_STORAGE_KEY, EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

type Transaction = {
  type: 'sale' | 'expense';
  date: Date;
  description: string;
  amount: number;
};

export default function FinancialOverviewPage() {
  const { user } = useAuth();
  
  const [totalRevenue, setTotalRevenue] = React.useState(0);
  const [totalExpenses, setTotalExpenses] = React.useState(0);
  const [totalTransactions, setTotalTransactions] = React.useState(0);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const getFinalPrice = (service: Service, allPlans: Plan[]): number => {
    if (service.finalPrice !== undefined) {
      return service.finalPrice;
    }
    const plan = allPlans.find(p => p.id === service.planId);
    return plan?.price || 0;
  }

  React.useEffect(() => {
    if (!user) return;

    try {
      const storedServicesStr = localStorage.getItem(SERVICES_STORAGE_KEY);
      const storedPlansStr = localStorage.getItem(PLANS_STORAGE_KEY);
      const storedExpensesStr = localStorage.getItem(EXPENSES_STORAGE_KEY);

      const allServices: Service[] = storedServicesStr ? JSON.parse(storedServicesStr) : [];
      const allPlans: Plan[] = storedPlansStr ? JSON.parse(storedPlansStr) : [];
      const allExpenses: Expense[] = storedExpensesStr ? JSON.parse(storedExpensesStr) : [];
      
      // Calculate KPIs
      const revenue = allServices.reduce((acc, s) => acc + getFinalPrice(s, allPlans), 0);
      const expenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);
      
      setTotalRevenue(revenue);
      setTotalExpenses(expenses);
      setTotalTransactions(allServices.length);

      // Prepare Chart Data for last 6 months
      const last6MonthsData = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const monthlyRevenue = allServices
          .filter(s => isWithinInterval(new Date(s.createdAt), { start: monthStart, end: monthEnd }))
          .reduce((acc, s) => acc + getFinalPrice(s, allPlans), 0);
          
        const monthlyExpenses = allExpenses
          .filter(e => isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }))
          .reduce((acc, e) => acc + e.amount, 0);

        return {
          name: new Date(date).toLocaleDateString('fa-IR', { month: 'short' }),
          درآمد: monthlyRevenue,
          هزینه: monthlyExpenses,
        };
      }).reverse();
      setChartData(last6MonthsData);
      
      // Prepare Recent Transactions
      const salesTransactions: Transaction[] = allServices.map(s => {
          const plan = allPlans.find(p => p.id === s.planId);
          return {
            type: 'sale',
            date: new Date(s.createdAt),
            description: `فروش پلن: ${plan?.name || 'نامشخص'}`,
            amount: getFinalPrice(s, allPlans)
          }
      });
      const expenseTransactions: Transaction[] = allExpenses.map(e => ({
          type: 'expense',
          date: new Date(e.date),
          description: `هزینه: ${e.title}`,
          amount: e.amount
      }));
      
      const allTransactions = [...salesTransactions, ...expenseTransactions];
      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentTransactions(allTransactions.slice(0, 10));

    } catch (error) {
      console.error("Failed to load financial data from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('fa-IR').format(Math.abs(amount));
    return isNegative ? `(${formatted})` : formatted;
  }

  if (isLoading || !user) {
    return <div>در حال بارگذاری اطلاعات مالی...</div>
  }
  
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                <CandlestickChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                <h1 className="text-2xl font-bold tracking-tight">بررسی کلی مالی</h1>
                <p className="text-muted-foreground">
                    نمای کلی از درآمد، هزینه‌ها و سود کسب‌وکار شما.
                </p>
                </div>
            </div>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درآمد</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">مجموع فروش از ابتدا</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل هزینه‌ها</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">مجموع هزینه‌های ثبت شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود خالص</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue - totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">سود پس از کسر هزینه‌ها</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد تراکنش‌ها</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions.toLocaleString('fa-IR')}</div>
            <p className="text-xs text-muted-foreground">تعداد کل سرویس‌های فروخته شده</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>نمودار درآمد و هزینه (۶ ماه گذشته)</CardTitle>
          <CardDescription>مقایسه درآمد و هزینه به تفکیک ماه.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number, name: string) => [`${formatCurrency(value)} تومان`, name]}
              />
              <Legend wrapperStyle={{fontSize: '0.8rem'}} />
              <Bar dataKey="درآمد" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="هزینه" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>آخرین تراکنش‌ها</CardTitle>
            <CardDescription>۱۰ تراکنش مالی آخر (شامل فروش و هزینه).</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>نوع</TableHead>
                        <TableHead>شرح</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead className="text-left">مبلغ (تومان)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentTransactions.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24">تراکنشی یافت نشد.</TableCell></TableRow>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    {tx.type === 'sale' ? (
                                        <Badge variant="outline" className="text-green-500 border-green-500"><ArrowUp className="w-3 h-3 ml-1" />درآمد</Badge>
                                    ) : (
                                        <Badge variant="destructive"><ArrowDown className="w-3 h-3 ml-1" />هزینه</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{tx.description}</TableCell>
                                <TableCell>{tx.date.toLocaleDateString('fa-IR')}</TableCell>
                                <TableCell className={`text-left font-mono ${tx.type === 'sale' ? 'text-green-500' : 'text-destructive'}`}>
                                    {tx.type === 'sale' ? '+' : '-'} {formatCurrency(tx.amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
