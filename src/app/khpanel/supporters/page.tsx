
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LifeBuoy, PlusCircle, File, MoreHorizontal, Trash2, Edit, Ticket, Users, CreditCard, Layers3, Package, Percent, HandCoins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Account, SupporterType, SupporterPermissions } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const initialPermissions: SupporterPermissions = {
  canViewTickets: true,
  canViewUsers: false,
  canViewServices: false,
  canViewPackages: false,
  canViewCoupons: false,
  canViewTopUpRequests: false,
};

const supporterTypeMap: Record<SupporterType, string> = {
  financial: 'مالی',
  ticket: 'تیکت',
  technical: 'فنی',
  full: 'فول',
};

export default function SupportersPage() {
  const { user, accounts, setAccounts } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<Account | null>(null);
  
  // Form state
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [supporterType, setSupporterType] = React.useState<SupporterType>('ticket');
  const [permissions, setPermissions] = React.useState<SupporterPermissions>(initialPermissions);
  
  // Security check
  React.useEffect(() => {
    if (user && user.role !== 'superadmin' && user.role !== 'admin') {
      toast({
        title: 'دسترسی غیرمجاز',
        description: 'شما اجازه مشاهده این صفحه را ندارید.',
        variant: 'destructive',
      });
      router.push('/khpanel/dashboard');
    }
  }, [user, router, toast]);

  const supporters = React.useMemo(() => {
    return (accounts || []).filter(acc => acc.role === 'supporter');
  }, [accounts]);

  const resetUserForm = () => {
    setUserName('');
    setUserEmail('');
    setPassword('');
    setSupporterType('ticket');
    setPermissions(initialPermissions);
    setEditingUser(null);
  };

  const handleOpenUserDialog = (userToEdit: Account | null = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserName(userToEdit.name);
      setUserEmail(userToEdit.email);
      setPassword('');
      setSupporterType(userToEdit.supporterType || 'ticket');
      setPermissions(userToEdit.supporterPermissions || initialPermissions);
    } else {
      resetUserForm();
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!userName || !userEmail) {
      toast({ title: 'خطا', description: 'لطفاً نام و ایمیل را وارد کنید.', variant: 'destructive' });
      return;
    }
    
    if (!editingUser && !password) {
      toast({ title: 'خطا', description: 'برای پشتیبان جدید، وارد کردن رمز عبور الزامی است.', variant: 'destructive' });
      return;
    }
    
    let updatedAccounts: Account[];
    if (editingUser) {
      if (userEmail !== editingUser.email && accounts.some(acc => acc.email === userEmail)) {
          toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
          return;
      }
      const updatedUser: Account = {
        ...editingUser,
        name: userName,
        email: userEmail,
        supporterType: supporterType,
        supporterPermissions: permissions,
        ...(password && { password: password }),
      };
      updatedAccounts = accounts.map(u => (u.id === editingUser.id ? updatedUser : u));
      toast({ title: 'موفقیت‌آمیز', description: 'پشتیبان با موفقیت ویرایش شد.' });
    } else {
      if (accounts.some(acc => acc.email === userEmail)) {
        toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
        return;
      }
      const newSupporter: Account = {
        id: `supporter-${new Date().toISOString()}`,
        name: userName,
        email: userEmail,
        password: password,
        role: 'supporter',
        status: 'active',
        createdAt: new Date().toISOString(),
        supporterType: supporterType,
        supporterPermissions: permissions,
      };
      updatedAccounts = [...accounts, newSupporter];
      toast({ title: 'موفقیت‌آمیز', description: 'پشتیبان جدید با موفقیت اضافه شد.' });
    }
    
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    setIsUserDialogOpen(false);
    resetUserForm();
  };

  const handleDeleteUser = (userId: string) => {
    const updatedAccounts = accounts.filter(u => u.id !== userId);
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    toast({ title: 'موفقیت‌آمیز', description: 'پشتیبان مورد نظر حذف شد.' });
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
      return 'نامعتبر';
    }
  };

  const handlePermissionChange = (key: keyof SupporterPermissions, value: boolean) => {
    setPermissions(prev => ({...prev, [key]: value}));
  };

  React.useEffect(() => {
    if (!isUserDialogOpen) {
      resetUserForm();
    }
  }, [isUserDialogOpen]);

  if (user?.role !== 'superadmin' && user?.role !== 'admin') {
      return <div className="flex h-screen items-center justify-center">در حال بررسی دسترسی...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <LifeBuoy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت پشتیبان‌ها</h1>
              <p className="text-muted-foreground">
                پشتیبان‌های سیستم را اضافه، ویرایش یا حذف کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <File className="ml-2 h-4 w-4" />
              خروجی
            </Button>
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenUserDialog()}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  پشتیبان جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'ویرایش پشتیبان' : 'افزودن پشتیبان جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">نام</Label>
                    <Input id="user-name" value={userName} onChange={e => setUserName(e.target.value)} placeholder="مثلاً: علی رضایی"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">ایمیل</Label>
                    <Input id="user-email" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="supporter@example.com"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingUser ? 'برای تغییر، رمز جدید وارد کنید' : 'رمز عبور را وارد کنید'}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supporter-type">نوع پشتیبان</Label>
                    <Select value={supporterType} onValueChange={(value) => setSupporterType(value as SupporterType)}>
                      <SelectTrigger id="supporter-type">
                        <SelectValue placeholder="نوع را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ticket">تیکت</SelectItem>
                        <SelectItem value="technical">فنی</SelectItem>
                        <SelectItem value="financial">مالی</SelectItem>
                        <SelectItem value="full">فول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>سطوح دسترسی</Label>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="perm-tickets" className="flex items-center gap-2 font-normal"><Ticket className="h-4 w-4" /> تیکت پشتیبانی</Label>
                        <Switch id="perm-tickets" checked={permissions.canViewTickets} onCheckedChange={(v) => handlePermissionChange('canViewTickets', v)} dir="ltr"/>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="perm-users" className="flex items-center gap-2 font-normal"><Users className="h-4 w-4" /> کاربران و نمایندگان</Label>
                        <Switch id="perm-users" checked={permissions.canViewUsers} onCheckedChange={(v) => handlePermissionChange('canViewUsers', v)} dir="ltr"/>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="perm-services" className="flex items-center gap-2 font-normal"><Layers3 className="h-4 w-4" /> سرویس‌ها</Label>
                        <Switch id="perm-services" checked={permissions.canViewServices} onCheckedChange={(v) => handlePermissionChange('canViewServices', v)} dir="ltr"/>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="perm-packages" className="flex items-center gap-2 font-normal"><Package className="h-4 w-4" /> بسته‌ها</Label>
                        <Switch id="perm-packages" checked={permissions.canViewPackages} onCheckedChange={(v) => handlePermissionChange('canViewPackages', v)} dir="ltr"/>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="perm-coupons" className="flex items-center gap-2 font-normal"><Percent className="h-4 w-4" /> کدهای تخفیف</Label>
                        <Switch id="perm-coupons" checked={permissions.canViewCoupons} onCheckedChange={(v) => handlePermissionChange('canViewCoupons', v)} dir="ltr"/>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="perm-topup" className="flex items-center gap-2 font-normal"><HandCoins className="h-4 w-4" /> درخواست‌های شارژ</Label>
                        <Switch id="perm-topup" checked={permissions.canViewTopUpRequests} onCheckedChange={(v) => handlePermissionChange('canViewTopUpRequests', v)} dir="ltr"/>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveUser}>{editingUser ? 'ذخیره تغییرات' : 'افزودن پشتیبان'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
              <CardTitle>لیست پشتیبان‌ها</CardTitle>
              <CardDescription>
                  در این جدول می‌توانید لیست کامل پشتیبان‌های سیستم را مشاهده کنید.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supporters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      هیچ پشتیبانی در سیستم تعریف نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  supporters.map(supporter => (
                    <TableRow key={supporter.id}>
                      <TableCell className="font-medium">{supporter.name}</TableCell>
                      <TableCell>{supporter.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{supporterTypeMap[supporter.supporterType || 'ticket']}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                      </TableCell>
                      <TableCell>{formatDate(supporter.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">باز کردن منو</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenUserDialog(supporter)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    ویرایش
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(supporter.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    حذف
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
    </>
  );
}
