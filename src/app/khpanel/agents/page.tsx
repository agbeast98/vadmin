
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserCog, PlusCircle, File, MoreHorizontal, Trash2, Edit, Copy, TrendingUp, TrendingDown } from 'lucide-react';
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
import type { Account } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function AgentsPage() {
  const { user, accounts, setAccounts } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<Account | null>(null);

  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = React.useState(false);
  const [selectedFinancialUser, setSelectedFinancialUser] = React.useState<Account | null>(null);
  const [financialAmount, setFinancialAmount] = React.useState('');
  
  // Form state
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [walletBalance, setWalletBalance] = React.useState('');
  const [allowNegative, setAllowNegative] = React.useState(false);
  const [negativeLimit, setNegativeLimit] = React.useState('');
  
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

  const agents = React.useMemo(() => {
    return (accounts || []).filter(acc => acc.role === 'agent');
  }, [accounts]);

  const resetUserForm = () => {
    setUserName('');
    setUserEmail('');
    setPassword('');
    setWalletBalance('');
    setAllowNegative(false);
    setNegativeLimit('');
    setEditingUser(null);
  };

  const handleOpenUserDialog = (userToEdit: Account | null = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserName(userToEdit.name);
      setUserEmail(userToEdit.email);
      setPassword('');
      setWalletBalance(userToEdit.walletBalance !== undefined ? String(userToEdit.walletBalance) : '');
      setAllowNegative(userToEdit.allowNegativeBalance || false);
      setNegativeLimit(userToEdit.negativeBalanceLimit !== undefined ? String(userToEdit.negativeBalanceLimit) : '');
    } else {
      resetUserForm();
    }
    setIsUserDialogOpen(true);
  };

  const generateAgentCode = (name: string): string => {
    const prefix = name.substring(0, 3).toUpperCase();
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomNumber}`;
  }

  const handleSaveUser = () => {
    if (!userName || !userEmail) {
      toast({ title: 'خطا', description: 'لطفاً نام و ایمیل را وارد کنید.', variant: 'destructive' });
      return;
    }
    
    if (!editingUser && !password) {
      toast({ title: 'خطا', description: 'برای نماینده جدید، وارد کردن رمز عبور الزامی است.', variant: 'destructive' });
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
        walletBalance: parseFloat(walletBalance) || 0,
        allowNegativeBalance: allowNegative,
        negativeBalanceLimit: allowNegative ? (parseFloat(negativeLimit) || 0) : undefined,
        ...(password && { password: password }),
      };
      updatedAccounts = accounts.map(u => (u.id === editingUser.id ? updatedUser : u));
      toast({ title: 'موفقیت‌آمیز', description: 'نماینده با موفقیت ویرایش شد.' });
    } else {
      if (accounts.some(acc => acc.email === userEmail)) {
        toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
        return;
      }
      const newAgent: Account = {
        id: `agent-${new Date().toISOString()}`,
        name: userName,
        email: userEmail,
        password: password,
        role: 'agent',
        status: 'active',
        createdAt: new Date().toISOString(),
        code: generateAgentCode(userName),
        walletBalance: parseFloat(walletBalance) || 0,
        allowNegativeBalance: allowNegative,
        negativeBalanceLimit: allowNegative ? (parseFloat(negativeLimit) || 0) : undefined,
      };
      updatedAccounts = [...accounts, newAgent];
      toast({ title: 'موفقیت‌آمیز', description: 'نماینده جدید با موفقیت اضافه شد.' });
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
    toast({ title: 'موفقیت‌آمیز', description: 'نماینده مورد نظر حذف شد.' });
  };
  
  const handleOpenFinancialDialog = (user: Account) => {
    setSelectedFinancialUser(user);
    setFinancialAmount('');
    setIsFinancialDialogOpen(true);
  }

  const handleUpdateBalance = (action: 'increase' | 'decrease') => {
    if (!selectedFinancialUser || !financialAmount) {
        toast({ title: 'خطا', description: 'لطفاً مبلغ را وارد کنید.', variant: 'destructive' });
        return;
    }

    const amount = parseFloat(financialAmount);
    if (isNaN(amount) || amount <= 0) {
         toast({ title: 'خطا', description: 'مبلغ وارد شده معتبر نیست.', variant: 'destructive' });
        return;
    }
    
    const currentBalance = selectedFinancialUser.walletBalance || 0;
    
    if (action === 'decrease') {
        const creditLimit = selectedFinancialUser.allowNegativeBalance ? (selectedFinancialUser.negativeBalanceLimit || 0) : 0;
        if (currentBalance - amount < -creditLimit) {
            toast({ title: 'خطا', description: 'مبلغ کاهش نمی‌تواند بیشتر از حد اعتبار کاربر باشد.', variant: 'destructive' });
            return;
        }
    }
    
    const newBalance = action === 'increase' ? currentBalance + amount : currentBalance - amount;

    const updatedAccounts = accounts.map(acc => 
        acc.id === selectedFinancialUser.id ? { ...acc, walletBalance: newBalance } : acc
    );
    
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    
    toast({
        title: 'موفقیت‌آمیز',
        description: `موجودی ${selectedFinancialUser.name} با موفقیت به ${formatCurrency(newBalance)} تغییر یافت.`
    });

    setIsFinancialDialogOpen(false);
  }


  const handleCopyCode = (code?: string) => {
    if(!code) return;
    navigator.clipboard.writeText(code);
    toast({ title: 'کپی شد', description: `کد ${code} در کلیپ‌بورد شما کپی شد.`});
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch {
      return 'نامعتبر';
    }
  };
  
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '-';
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('fa-IR').format(Math.abs(amount)) + ' تومان';
    return isNegative ? `(${formatted})` : formatted;
  }

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
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت نمایندگان</h1>
              <p className="text-muted-foreground">
                نمایندگان فروش سیستم را اضافه، ویرایش یا حذف کنید.
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
                  نماینده جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'ویرایش نماینده' : 'افزودن نماینده جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">نام</Label>
                    <Input id="user-name" value={userName} onChange={e => setUserName(e.target.value)} placeholder="مثلاً: علی رضایی"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">ایمیل</Label>
                    <Input id="user-email" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="agent@example.com"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingUser ? 'برای تغییر، رمز جدید وارد کنید' : 'رمز عبور را وارد کنید'}/>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="wallet-balance">موجودی کیف پول (تومان)</Label>
                    <Input id="wallet-balance" type="number" value={walletBalance} onChange={e => setWalletBalance(e.target.value)} placeholder="موجودی را به تومان وارد کنید"/>
                  </div>
                  <Separator />
                  <Card className="bg-muted/50 p-4">
                     <CardHeader className="p-0 pb-4">
                       <CardTitle className="text-base">مدیریت اعتبار</CardTitle>
                       <CardDescription className="text-xs">
                         به نماینده اجازه دهید تا سقف مشخصی، موجودی منفی داشته باشد.
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="p-0 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="allow-negative" className="flex-1">اجازه موجودی منفی</Label>
                            <Switch id="allow-negative" checked={allowNegative} onCheckedChange={setAllowNegative} dir="ltr" />
                        </div>
                        {allowNegative && (
                            <div className="space-y-2">
                                <Label htmlFor="negative-limit">سقف بدهی (تومان)</Label>
                                <Input 
                                    id="negative-limit" 
                                    type="number" 
                                    value={negativeLimit} 
                                    onChange={e => setNegativeLimit(e.target.value)} 
                                    placeholder="مثلاً: 50000"
                                    disabled={!allowNegative}
                                />
                            </div>
                        )}
                     </CardContent>
                  </Card>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveUser}>{editingUser ? 'ذخیره تغییرات' : 'افزودن نماینده'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
              <CardTitle>لیست نمایندگان</CardTitle>
              <CardDescription>
                  در این جدول می‌توانید لیست کامل نمایندگان فروش سیستم را مشاهده کنید.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>کد فروش</TableHead>
                  <TableHead>کیف پول</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      هیچ نماینده‌ای در سیستم تعریف نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => handleCopyCode(agent.code)}>
                          <Copy className="h-3 w-3 ml-1" />
                          {agent.code || '-'}
                        </Badge>
                      </TableCell>
                       <TableCell className={`font-medium ${(agent.walletBalance || 0) < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(agent.walletBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                      </TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenUserDialog(agent)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    ویرایش
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenFinancialDialog(agent)}>
                                    مدیریت مالی
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(agent.id)}>
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

       <Dialog open={isFinancialDialogOpen} onOpenChange={setIsFinancialDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>مدیریت مالی نماینده</DialogTitle>
                {selectedFinancialUser && (
                    <DialogDescription>
                        مدیریت موجودی کیف پول برای <span className="font-bold">{selectedFinancialUser.name}</span>.
                    </DialogDescription>
                )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="flex justify-between items-center bg-muted p-3 rounded-md">
                    <span className="text-sm font-medium">موجودی فعلی:</span>
                    <span className={`text-sm font-bold ${(selectedFinancialUser?.walletBalance || 0) < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {formatCurrency(selectedFinancialUser?.walletBalance)}
                    </span>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="financial-amount">مبلغ (تومان)</Label>
                    <Input 
                        id="financial-amount" 
                        type="number" 
                        value={financialAmount}
                        onChange={(e) => setFinancialAmount(e.target.value)}
                        placeholder="مبلغ مورد نظر را وارد کنید"
                    />
                </div>
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2">
                <Button variant="destructive" onClick={() => handleUpdateBalance('decrease')}>
                  <TrendingDown className="ml-2 h-4 w-4" />
                  کاهش موجودی
                </Button>
                <Button onClick={() => handleUpdateBalance('increase')}>
                  <TrendingUp className="ml-2 h-4 w-4" />
                  افزایش موجودی
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    