
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Eye, Banknote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { TopUpRequest, TopUpRequestStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { TOP_UP_REQUESTS_STORAGE_KEY } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function WalletHistoryPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [requests, setRequests] = React.useState<TopUpRequest[]>([]);

  React.useEffect(() => {
    if (!user) return;
    try {
      const storedRequests = localStorage.getItem(TOP_UP_REQUESTS_STORAGE_KEY);
      if (storedRequests) {
          const allRequests: TopUpRequest[] = JSON.parse(storedRequests);
          const userRequests = allRequests
            .filter(r => r.userId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRequests(userRequests);
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری تاریخچه درخواست‌ها رخ داد.', variant: 'destructive' });
    }
  }, [toast, user]);

  const getStatusBadge = (status: TopUpRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">در انتظار</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500">تأیید شده</Badge>;
      case 'rejected':
        return <Badge variant="destructive">رد شده</Badge>;
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  const formatDate = (date: string) => new Date(date).toLocaleString('fa-IR');

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
                <History className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">تاریخچه درخواست‌های شارژ</h1>
                <p className="text-muted-foreground">
                    در این بخش می‌توانید تاریخچه و وضعیت تمام درخواست‌های افزایش موجودی خود را مشاهده کنید.
                </p>
            </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست درخواست‌های من</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ درخواست</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      تاکنون هیچ درخواست شارژی ثبت نکرده‌اید.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{formatCurrency(req.amount)}</TableCell>
                      <TableCell>{formatDate(req.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
