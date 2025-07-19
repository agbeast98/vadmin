
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Download, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { Invoice, Account } from '@/lib/types';
import { INVOICES_STORAGE_KEY, ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const { accounts } = useAuth();
  
  React.useEffect(() => {
    try {
        const storedInvoices = localStorage.getItem(INVOICES_STORAGE_KEY);
        if (storedInvoices) {
            setInvoices(JSON.parse(storedInvoices));
        }
    } catch (e) {
        console.error("Failed to load invoices from storage", e);
    }
  }, []);

  const getAccountName = (userId: string) => {
    return accounts.find(acc => acc.id === userId)?.name || 'کاربر حذف شده';
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }

  const getStatusBadge = (status: 'paid' | 'pending' | 'cancelled') => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="text-green-500 border-green-500">پرداخت شده</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">در انتظار</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">لغو شده</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">مدیریت فاکتورها</h1>
                    <p className="text-muted-foreground">
                        فاکتورهای صادر شده برای مشتریان را مشاهده و مدیریت کنید.
                    </p>
                </div>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>لیست فاکتورها</CardTitle>
                <CardDescription>
                  این لیست به صورت خودکار با هر خرید موفق، به‌روزرسانی خواهد شد.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>شماره فاکتور</TableHead>
                        <TableHead>مشتری</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>تاریخ صدور</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead className="text-right">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Receipt className="w-10 h-10" />
                              <p className="font-semibold">هیچ فاکتوری برای نمایش وجود ندارد</p>
                              <p className="text-sm">فاکتورها پس از خرید موفق مشتریان در این بخش ثبت می‌شوند.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">{invoice.id}</TableCell>
                            <TableCell>{getAccountName(invoice.userId)}</TableCell>
                            <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell>{new Date(invoice.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status as any)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="ml-2 h-4 w-4" />
                                    مشاهده
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="ml-2 h-4 w-4" />
                                    دانلود PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
