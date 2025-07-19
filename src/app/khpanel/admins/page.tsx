
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, PlusCircle, File, Search, MoreHorizontal, ShieldAlert, Trash2, Edit } from 'lucide-react';
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
import type { Account, Permissions } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { addAccount, updateAccount, deleteAccount } from '@/lib/data-service';

const defaultPermissions: Permissions = {
  telegramBot: true,
  panelAlireza: true,
  panelSanaei: true,
  panelMarzban: true,
  panelShahan: true,
  panelAgents: true,
  premadeStock: true,
};

export default function AdminsPage() {
  const { user, accounts, setAccounts } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<Account | null>(null);
  
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  // Security check: Only superadmins can access this page
  React.useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast({
        title: 'دسترسی غیرمجاز',
        description: 'شما اجازه مشاهده این صفحه را ندارید.',
        variant: 'destructive',
      });
      router.push('/khpanel/dashboard');
    }
  }, [user, router, toast]);

  const admins = React.useMemo(() => {
    return (accounts || []).filter(acc => acc.role === 'admin');
  }, [accounts]);

  const resetUserForm = () => {
    setUserName('');
    setUserEmail('');
    setPassword('');
    setEditingUser(null);
  };

  const handleOpenUserDialog = (userToEdit: Account | null = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserName(userToEdit.name);
      setUserEmail(userToEdit.email);
      setPassword(''); 
    } else {
      resetUserForm();
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userName || !userEmail) {
      toast({ title: 'خطا', description: 'لطفاً نام و ایمیل را وارد کنید.', variant: 'destructive' });
      return;
    }
    
    if (!editingUser && !password) {
      toast({ title: 'خطا', description: 'برای ادمین جدید، وارد کردن رمز عبور الزامی است.', variant: 'destructive' });
      return;
    }
    
    if (editingUser) {
      if (userEmail !== editingUser.email && accounts.some(acc => acc.email === userEmail)) {
          toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
          return;
      }
      const updatedUser: Account = {
        ...editingUser,
        name: userName,
        email: userEmail,
        ...(password && { password: password }),
      };
      const result = await updateAccount(updatedUser);
      if(result.success) {
        setAccounts(prev => prev.map(u => (u.id === editingUser.id ? updatedUser : u)));
        toast({ title: 'موفقیت‌آمیز', description: 'ادمین با موفقیت ویرایش شد.' });
      } else {
        toast({ title: 'خطا', description: result.error, variant: 'destructive' });
      }

    } else {
      if (accounts.some(acc => acc.email === userEmail)) {
        toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
        return;
      }
      const newAdmin: Account = {
        id: `admin-${new Date().toISOString()}`,
        name: userName,
        email: userEmail,
        password: password,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        permissions: defaultPermissions,
      };
      const result = await addAccount(newAdmin);
      if(result.success) {
        setAccounts(prev => [...prev, newAdmin]);
        toast({ title: 'موفقیت‌آمیز', description: 'ادمین جدید با موفقیت اضافه شد.' });
      } else {
        toast({ title: 'خطا', description: result.error, variant: 'destructive' });
      }
    }
    
    setIsUserDialogOpen(false);
    resetUserForm();
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteAccount(userId);
    if(result.success) {
      setAccounts(prev => prev.filter(u => u.id !== userId));
      toast({ title: 'موفقیت‌آمیز', description: 'ادمین مورد نظر حذف شد.' });
    } else {
      toast({ title: 'خطا', description: result.error, variant: 'destructive' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'نامحدود';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
      return 'نامعتبر';
    }
  };

  React.useEffect(() => {
    if (!isUserDialogOpen) {
      resetUserForm();
    }
  }, [isUserDialogOpen]);

  if (user?.role !== 'superadmin') {
      return <div className="flex h-screen items-center justify-center">در حال بررسی دسترسی...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت ادمین‌ها</h1>
              <p className="text-muted-foreground">
                ادمین‌های سیستم را اضافه، ویرایش یا حذف کنید.
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
                  ادمین جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'ویرایش ادمین' : 'افزودن ادمین جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">نام</Label>
                    <Input id="user-name" value={userName} onChange={e => setUserName(e.target.value)} placeholder="مثلاً: علی رضایی"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">ایمیل</Label>
                    <Input id="user-email" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="admin@example.com"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingUser ? 'برای تغییر، رمز جدید وارد کنید' : 'رمز عبور را وارد کنید'}/>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveUser}>{editingUser ? 'ذخیره تغییرات' : 'افزودن ادمین'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>لیست ادمین‌ها</CardTitle>
              </div>
              <CardDescription>
                  در این جدول می‌توانید لیست کامل ادمین‌های سیستم را مشاهده کنید.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      هیچ ادمینی در سیستم تعریف نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map(admin => {
                    return (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                           <TableCell>{admin.email}</TableCell>
                          <TableCell>{formatDate(admin.createdAt)}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleOpenUserDialog(admin)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        ویرایش
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(admin.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        حذف
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
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
}
