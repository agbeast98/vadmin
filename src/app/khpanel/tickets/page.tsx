
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Ticket, PlusCircle, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Ticket as TicketType, TicketStatus, TicketPriority, TicketDepartment, Service, Account, TicketReply } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { TICKETS_STORAGE_KEY, TICKET_COUNTER_STORAGE_KEY, SERVICES_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';

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

const initialFormState = {
  subject: '',
  department: 'TECHNICAL' as TicketDepartment,
  priority: 'MEDIUM' as TicketPriority,
  message: '',
  relatedServiceId: '',
  userId: '', // For admins to select a user
};

export default function TicketsPage() {
  const { user, accounts } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tickets, setTickets] = React.useState<TicketType[]>([]);
  const [userServices, setUserServices] = React.useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Form state
  const [formState, setFormState] = React.useState(initialFormState);
  
  const canViewAllTickets = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'supporter';

  const sortTickets = (ticketList: TicketType[]): TicketType[] => {
    const statusOrder: Record<TicketStatus, number> = {
      OPEN: 1,
      IN_PROGRESS: 2,
      CLOSED: 3
    };

    return ticketList.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  React.useEffect(() => {
    if (!user) return;
    try {
      const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (storedTickets) {
        const parsedTickets: TicketType[] = JSON.parse(storedTickets);
        setTickets(sortTickets(parsedTickets));
      }
      
      const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
      if(storedServices) {
          const allServices: Service[] = JSON.parse(storedServices);
          // If user is admin, they shouldn't have services to choose from for themselves.
          // Services are selected based on the user chosen in the form.
          if (!canViewAllTickets) {
             setUserServices(allServices.filter(s => s.userId === user.id));
          }
      }

    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری تیکت‌ها رخ داد.', variant: 'destructive' });
    }
  }, [toast, user, canViewAllTickets]);
  
  // Update user services when a user is selected by an admin
  React.useEffect(() => {
    if (canViewAllTickets && formState.userId) {
        const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
        if(storedServices) {
            const allServices: Service[] = JSON.parse(storedServices);
            setUserServices(allServices.filter(s => s.userId === formState.userId));
        }
    } else if (!canViewAllTickets && user) {
       // logic for non-admin users is handled in the main useEffect
    } else {
        setUserServices([]);
    }
  }, [canViewAllTickets, formState.userId, user]);


  const displayedTickets = React.useMemo(() => {
    if (!user) return [];
    if (canViewAllTickets) {
      return tickets;
    }
    return tickets.filter(t => t.userId === user.id);
  }, [user, tickets, canViewAllTickets]);

  const updateTicketsState = (updatedTickets: TicketType[]) => {
    const sorted = sortTickets(updatedTickets);
    setTickets(sorted);
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(sorted));
  };
  
  const getNextTicketId = () => {
    let counter = parseInt(localStorage.getItem(TICKET_COUNTER_STORAGE_KEY) || '1000');
    counter++;
    localStorage.setItem(TICKET_COUNTER_STORAGE_KEY, counter.toString());
    return `TKT-${counter}`;
  }

  const handleSaveTicket = () => {
    if (!user || !formState.subject || !formState.message) {
      toast({ title: 'خطا', description: 'لطفاً موضوع و متن پیام را وارد کنید.', variant: 'destructive' });
      return;
    }
    
    const targetUserId = canViewAllTickets ? formState.userId : user.id;

    if (!targetUserId) {
        toast({ title: 'خطا', description: 'لطفاً کاربری که تیکت برای او ثبت می‌شود را مشخص کنید.', variant: 'destructive' });
        return;
    }

    const now = new Date().toISOString();

    const firstReply: TicketReply = {
      id: `reply-${Date.now()}`,
      authorId: user.id, // The author is always the logged-in user
      message: formState.message,
      createdAt: now,
    };
    
    const newTicket: TicketType = {
      id: getNextTicketId(),
      subject: formState.subject,
      department: formState.department,
      priority: formState.priority,
      status: 'OPEN',
      userId: targetUserId,
      relatedServiceId: formState.relatedServiceId || undefined,
      createdAt: now,
      updatedAt: now,
      replies: [firstReply],
    };

    const updatedTickets = [newTicket, ...tickets];
    updateTicketsState(updatedTickets);

    toast({ title: 'موفقیت‌آمیز', description: `تیکت شما با شماره ${newTicket.id} با موفقیت ثبت شد.` });
    setIsDialogOpen(false);
    setFormState(initialFormState);
  };
  
  const getAccountName = (userId: string) => {
    return accounts.find(acc => acc.id === userId)?.name || 'کاربر حذف شده';
  }

  const customerAccounts = React.useMemo(() => {
    return accounts.filter(acc => acc.role === 'user' || acc.role === 'agent');
  }, [accounts]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">تیکت‌های پشتیبانی</h1>
              <p className="text-muted-foreground">
                سوالات و مشکلات خود را از این طریق با ما در میان بگذارید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setFormState(initialFormState)}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  تیکت جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>ارسال تیکت جدید</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                   {canViewAllTickets && (
                    <div className="space-y-2">
                        <Label htmlFor="ticket-user">کاربر</Label>
                        <Select value={formState.userId} onValueChange={(value) => setFormState(p => ({...p, userId: value, relatedServiceId: ''}))}>
                            <SelectTrigger id="ticket-user"><SelectValue placeholder="کاربر مورد نظر را انتخاب کنید"/></SelectTrigger>
                            <SelectContent>
                                {customerAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.email})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject">موضوع</Label>
                    <Input id="ticket-subject" value={formState.subject} onChange={e => setFormState(p => ({...p, subject: e.target.value}))} placeholder="خلاصه مشکل یا سوال شما" />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="ticket-department">دپارتمان</Label>
                        <Select value={formState.department} onValueChange={(value: TicketDepartment) => setFormState(p => ({...p, department: value}))}>
                            <SelectTrigger id="ticket-department"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TECHNICAL">پشتیبانی فنی</SelectItem>
                                <SelectItem value="FINANCIAL">بخش مالی</SelectItem>
                                <SelectItem value="SALES">بخش فروش</SelectItem>
                                <SelectItem value="GENERAL">عمومی</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ticket-priority">اولویت</Label>
                        <Select value={formState.priority} onValueChange={(value: TicketPriority) => setFormState(p => ({...p, priority: value}))}>
                            <SelectTrigger id="ticket-priority"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">کم</SelectItem>
                                <SelectItem value="MEDIUM">متوسط</SelectItem>
                                <SelectItem value="HIGH">زیاد</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  {userServices.length > 0 && (
                     <div className="space-y-2">
                        <Label htmlFor="related-service">سرویس مرتبط (اختیاری)</Label>
                        <Select value={formState.relatedServiceId} onValueChange={(value) => setFormState(p => ({...p, relatedServiceId: value}))}>
                            <SelectTrigger id="related-service"><SelectValue placeholder="سرویس مورد نظر را انتخاب کنید"/></SelectTrigger>
                            <SelectContent>
                                {userServices.map(s => <SelectItem key={s.id} value={s.id}>{s.clientEmail || `سرویس ${s.id.slice(-4)}`}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="ticket-message">متن پیام</Label>
                    <Textarea id="ticket-message" value={formState.message} onChange={e => setFormState(p => ({...p, message: e.target.value}))} rows={6} placeholder="مشکل خود را به طور کامل شرح دهید..."/>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveTicket}>ارسال تیکت</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست تیکت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره</TableHead>
                  {canViewAllTickets && <TableHead>کاربر</TableHead>}
                  <TableHead>موضوع</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>آخرین بروزرسانی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      هنوز هیچ تیکتی ثبت نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedTickets.map(ticket => (
                    <TableRow key={ticket.id} className="cursor-pointer" onClick={() => router.push(`/khpanel/tickets/${encodeURIComponent(ticket.id)}`)}>
                      <TableCell className="font-mono">{ticket.id}</TableCell>
                      {canViewAllTickets && <TableCell>{getAccountName(ticket.userId)}</TableCell>}
                      <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                       <TableCell>
                          <Badge className={`${priorityMap[ticket.priority].className} text-white`}>{priorityMap[ticket.priority].label}</Badge>
                      </TableCell>
                       <TableCell>
                          <Badge className={`${statusMap[ticket.status].className} text-white`}>{statusMap[ticket.status].label}</Badge>
                      </TableCell>
                      <TableCell>{new Date(ticket.updatedAt).toLocaleString('fa-IR')}</TableCell>
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
