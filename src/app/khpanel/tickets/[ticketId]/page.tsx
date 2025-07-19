
'use client';

import * as React from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { Ticket as TicketType, TicketReply, Account, TicketStatus, TicketPriority, TicketDepartment } from '@/lib/types';
import { TICKETS_STORAGE_KEY } from '@/lib/constants';
import { ArrowLeft, Send, UserCircle, Shield, MessageSquare, Clock, ChevronsRight, Flag, CircleDotDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const departmentMap: Record<TicketDepartment, string> = {
  TECHNICAL: 'پشتیبانی فنی',
  FINANCIAL: 'بخش مالی',
  SALES: 'بخش فروش',
  GENERAL: 'عمومی',
};

export default function TicketDetailPage() {
  const params = useParams();
  const { user, accounts } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [ticket, setTicket] = React.useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [replyMessage, setReplyMessage] = React.useState('');

  const ticketId = React.useMemo(() => {
    const id = params.ticketId;
    return typeof id === 'string' ? decodeURIComponent(id) : '';
  }, [params.ticketId]);


  React.useEffect(() => {
    if (!user || !ticketId) return;
    try {
      const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (storedTickets) {
        const allTickets: TicketType[] = JSON.parse(storedTickets);
        const foundTicket = allTickets.find(t => t.id === ticketId);
        
        const canViewTicket = user.role === 'admin' 
                            || user.role === 'superadmin' 
                            || user.role === 'supporter'
                            || foundTicket?.userId === user.id;
        
        if (foundTicket && canViewTicket) {
          setTicket(foundTicket);
        } else {
          setTicket(null); // Triggers notFound() later
        }
      }
    } catch (error) {
      console.error("Failed to load ticket", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, user]);

  const getAuthor = (authorId: string): Partial<Account> => {
    return accounts.find(acc => acc.id === authorId) || { name: 'کاربر حذف شده', role: 'user' };
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const words = name.split(' ');
    return words.length > 1 ? words[0][0] + words[1][0] : name.substring(0, 2);
  };
  
  const updateTicketInStorage = (updatedTicket: TicketType) => {
      const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
      const allTickets: TicketType[] = storedTickets ? JSON.parse(storedTickets) : [];
      const updatedTickets = allTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updatedTickets));
  }
  
  const handlePostReply = () => {
    if (!replyMessage.trim() || !user || !ticket) return;

    const newReply: TicketReply = {
      id: `reply-${Date.now()}`,
      authorId: user.id,
      message: replyMessage,
      createdAt: new Date().toISOString(),
    };
    
    const isPrivilegedUser = user.role === 'admin' || user.role === 'superadmin' || user.role === 'supporter';

    const updatedTicket: TicketType = {
        ...ticket,
        replies: [...ticket.replies, newReply],
        status: isPrivilegedUser ? ticket.status : 'IN_PROGRESS',
        updatedAt: new Date().toISOString(),
    };

    setTicket(updatedTicket);
    updateTicketInStorage(updatedTicket);
    setReplyMessage('');
    toast({ title: "موفقیت‌آمیز", description: "پاسخ شما با موفقیت ثبت شد." });
  };
  
  const handleStatusChange = (newStatus: TicketStatus) => {
      if (!ticket) return;
      const updatedTicket = { ...ticket, status: newStatus, updatedAt: new Date().toISOString() };
      setTicket(updatedTicket);
      updateTicketInStorage(updatedTicket);
      toast({ title: "موفقیت‌آمیز", description: "وضعیت تیکت به‌روزرسانی شد." });
  }

  const handlePriorityChange = (newPriority: TicketPriority) => {
      if (!ticket) return;
      const updatedTicket = { ...ticket, priority: newPriority, updatedAt: new Date().toISOString() };
      setTicket(updatedTicket);
      updateTicketInStorage(updatedTicket);
      toast({ title: "موفقیت‌آمیز", description: "اولویت تیکت به‌روزرسانی شد." });
  }


  if (isLoading) {
    return <div className="flex h-full items-center justify-center">در حال بارگذاری اطلاعات تیکت...</div>;
  }

  if (!ticket) {
    notFound();
  }
  
  const isPrivilegedUser = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'supporter';
  const ticketOwner = getAuthor(ticket.userId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/khpanel/tickets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
            <p className="text-muted-foreground text-sm">شماره تیکت: {ticket.id}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 flex-1">
        <div className="md:col-span-2 space-y-4">
            {ticket.replies.map((reply, index) => {
                const author = getAuthor(reply.authorId);
                const isAuthorAdminOrSupport = author.role === 'admin' || author.role === 'superadmin' || author.role === 'supporter';
                return (
                     <Card key={reply.id} className={cn(isAuthorAdminOrSupport ? 'bg-muted/50' : '')}>
                        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{author.name}</span>
                                     <span className="text-xs text-muted-foreground">{isAuthorAdminOrSupport ? 'پشتیبانی' : 'مشتری'}</span>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString('fa-IR')}</span>
                        </CardHeader>
                        <CardContent className="p-4 text-sm whitespace-pre-wrap">
                            {reply.message}
                        </CardContent>
                    </Card>
                )
            })}
           
            <Card>
                <CardHeader>
                    <CardTitle>ارسال پاسخ</CardTitle>
                </CardHeader>
                <CardContent>
                     <Textarea 
                        placeholder="پاسخ خود را اینجا بنویسید..." 
                        rows={6}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        disabled={ticket.status === 'CLOSED'}
                      />
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePostReply} disabled={!replyMessage.trim() || ticket.status === 'CLOSED'}>
                        <Send className="ml-2 h-4 w-4" />
                        ارسال
                    </Button>
                </CardFooter>
            </Card>

        </div>

        <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>اطلاعات تیکت</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><UserCircle className="w-4 h-4"/>ارسال کننده:</span>
                        <span className="font-medium">{ticketOwner.name}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/>تاریخ ایجاد:</span>
                        <span className="font-medium">{new Date(ticket.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4"/>دپارتمان:</span>
                        <span className="font-medium">{departmentMap[ticket.department]}</span>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status" className="flex items-center gap-2 text-muted-foreground"><CircleDotDashed className="w-4 h-4"/>وضعیت</Label>
                        <Select value={ticket.status} onValueChange={handleStatusChange} disabled={!isPrivilegedUser}>
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPEN">باز</SelectItem>
                                <SelectItem value="IN_PROGRESS">در حال بررسی</SelectItem>
                                <SelectItem value="CLOSED">بسته شده</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="priority" className="flex items-center gap-2 text-muted-foreground"><Flag className="w-4 h-4"/>اولویت</Label>
                        <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={!isPrivilegedUser}>
                            <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">کم</SelectItem>
                                <SelectItem value="MEDIUM">متوسط</SelectItem>
                                <SelectItem value="HIGH">زیاد</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
