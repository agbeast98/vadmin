
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HandCoins, MoreHorizontal, Check, X, Eye, Loader2, Banknote } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { TopUpRequest, TopUpRequestStatus, Account } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { TOP_UP_REQUESTS_STORAGE_KEY, ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function TopUpRequestsPage() {
  const { toast } = useToast();
  const { accounts, setAccounts } = useAuth();

  const [requests, setRequests] = React.useState<TopUpRequest[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<TopUpRequest | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    try {
      const storedRequests = localStorage.getItem(TOP_UP_REQUESTS_STORAGE_KEY);
      if (storedRequests) {
          const parsed = JSON.parse(storedRequests);
          const sorted = parsed.sort((a: TopUpRequest, b: TopUpRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRequests(sorted);
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری درخواست‌ها رخ داد.', variant: 'destructive' });
    }
  }, [toast]);

  const updateRequestsState = (updatedRequests: TopUpRequest[]) => {
    const sorted = updatedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRequests(sorted);
    localStorage.setItem(TOP_UP_REQUESTS_STORAGE_KEY, JSON.stringify(sorted));
  };
  
  const handleUpdateRequestStatus = (requestId: string, newStatus: TopUpRequestStatus) => {
    setIsProcessing(true);
    const requestToUpdate = requests.find(r => r.id === requestId);
    if (!requestToUpdate) {
        toast({ title: 'خطا', description: 'درخواست مورد نظر یافت نشد.', variant: 'destructive'});
        setIsProcessing(false);
        return;
    }
    
    // Update request status
    const updatedRequests = requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
    );
    updateRequestsState(updatedRequests);
    
    // If approved, update user's wallet
    if (newStatus === 'approved') {
        const userToUpdate = accounts.find(acc => acc.id === requestToUpdate.userId);
        if (userToUpdate) {
            const currentBalance = userToUpdate.walletBalance || 0;
            const newBalance = currentBalance + requestToUpdate.amount;
            
            const updatedAccounts = accounts.map(acc => 
                acc.id === userToUpdate.id ? { ...acc, walletBalance: newBalance } : acc
            );
            setAccounts(updatedAccounts);
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
            
            toast({ title: 'موفقیت‌آمیز', description: `درخواست تأیید شد و موجودی کاربر ${userToUpdate.name} افزایش یافت.`});
        } else {
            toast({ title: 'خطای کاربر', description: 'کاربر این درخواست یافت نشد اما وضعیت درخواست تغییر کرد.', variant: 'destructive'});
        }
    } else {
         toast({ title: 'موفقیت‌آمیز', description: `درخواست با موفقیت ${newStatus === 'rejected' ? 'رد' : 'به‌روز'} شد.`});
    }

    setIsProcessing(false);
  }

  const handleShowDetails = (request: TopUpRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  }
  
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
                <HandCoins className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">درخواست‌های شارژ کیف پول</h1>
                <p className="text-muted-foreground">
                    درخواست‌های افزایش موجودی کاربران و نمایندگان را مدیریت کنید.
                </p>
            </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست درخواست‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاربر</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ درخواست</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      هیچ درخواستی برای نمایش وجود ندارد.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.userName}</TableCell>
                      <TableCell>{formatCurrency(req.amount)}</TableCell>
                      <TableCell>{formatDate(req.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' ? (
                            <div className="flex gap-2 justify-end">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-600"
                                    onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                                    disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                                </Button>
                                 <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                    disabled={isProcessing}
                                >
                                   {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleShowDetails(req)}>
                                    <Eye className="h-4 w-4"/>
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="ghost" onClick={() => handleShowDetails(req)}>
                                <Eye className="h-4 w-4 ml-2"/>
                                مشاهده جزئیات
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>جزئیات رسید پرداخت</DialogTitle>
                {selectedRequest && <DialogDescription>رسید ثبت شده توسط {selectedRequest.userName}</DialogDescription>}
            </DialogHeader>
            {selectedRequest && (
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">مبلغ:</span>
                        <span className="font-bold">{formatCurrency(selectedRequest.amount)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">وضعیت:</span>
                        <span>{getStatusBadge(selectedRequest.status)}</span>
                    </div>
                    {selectedRequest.displayedAccount && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2"><Banknote className="w-4 h-4"/> اطلاعات حساب نمایش داده شده</h4>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">صاحب حساب:</span>
                                    <span>{selectedRequest.displayedAccount.cardHolder}</span>
                                </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">شماره کارت:</span>
                                    <span className="font-mono" dir="ltr">{selectedRequest.displayedAccount.cardNumber}</span>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}
                     <div className="space-y-2">
                        <Label>متن رسید:</Label>
                        <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap min-h-[100px]">
                            {selectedRequest.receiptDetails}
                        </div>
                     </div>
                </div>
            )}
          </DialogContent>
      </Dialog>
    </>
  );
}
