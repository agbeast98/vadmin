
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Trash2, ShieldAlert, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { LogEntry } from '@/lib/logger';
import { getLogs, clearLogs as clearLogsFromStorage } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  // Security check
  React.useEffect(() => {
    if (user && user.role !== 'superadmin' && user.role !== 'admin') {
      toast({
        title: 'دسترسی غیرمجاز',
        description: 'شما اجازه مشاهده این صفحه را ندارید.',
        variant: 'destructive',
      });
      router.push('/khpanel/dashboard');
    } else {
      setLogs(getLogs());
    }
  }, [user, router, toast]);

  const handleClearLogs = () => {
    clearLogsFromStorage();
    setLogs([]);
    toast({ title: 'موفقیت‌آمیز', description: 'تمام لاگ‌ها با موفقیت پاک شدند.' });
  };
  
  const handleCopyLogs = () => {
    if (logs.length === 0) {
      toast({ title: 'خطا', description: 'هیچ لاگی برای کپی کردن وجود ندارد.', variant: 'destructive' });
      return;
    }
    const logText = logs
      .map(log => `[${new Date(log.timestamp).toLocaleString('en-US')}] [${log.level.toUpperCase()}] [${log.context}] ${log.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(logText);
    toast({ title: 'موفقیت‌آمیز', description: 'تمام لاگ‌ها در کلیپ‌بورد کپی شدند.' });
  }

  const getBadgeForLevel = (level: 'info' | 'warn' | 'error') => {
    switch(level) {
        case 'info': return <Badge variant="secondary">Info</Badge>;
        case 'warn': return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-500/80">Warning</Badge>;
        case 'error': return <Badge variant="destructive">Error</Badge>;
    }
  }

  if (user?.role !== 'superadmin' && user?.role !== 'admin') {
    return <div className="flex h-screen items-center justify-center">در حال بررسی دسترسی...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <ScrollText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">لاگ‌های سیستم</h1>
              <p className="text-muted-foreground">
                وقایع و خطاهای رخ داده در سیستم را در این بخش مشاهده کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopyLogs}>
              <Copy className="ml-2 h-4 w-4" />
              کپی همه لاگ‌ها
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="ml-2 h-4 w-4" />
                    پاک کردن همه لاگ‌ها
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      <ShieldAlert className="inline-block text-destructive ml-2" />
                      آیا کاملاً مطمئن هستید؟
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      این یک عملیات غیرقابل بازگشت است. تمام تاریخچه لاگ‌ها برای همیشه حذف خواهد شد.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLogs} className="bg-destructive hover:bg-destructive/90">
                      بله، حذف کن
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست وقایع</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>زمان</TableHead>
                  <TableHead>سطح</TableHead>
                  <TableHead>بخش</TableHead>
                  <TableHead>پیام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      هیچ لاگی برای نمایش وجود ندارد.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono" dir="ltr">{new Date(log.timestamp).toLocaleString('en-US')}</TableCell>
                      <TableCell>{getBadgeForLevel(log.level)}</TableCell>
                      <TableCell>{log.context}</TableCell>
                      <TableCell className="font-mono text-xs">{log.message}</TableCell>
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
