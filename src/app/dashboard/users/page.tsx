
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, PlusCircle, File, Search, MoreHorizontal, UserCog, LifeBuoy, WalletCards, TrendingUp, TrendingDown, UserCheck, ShieldAlert } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Account, Role } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { SERVICES_STORAGE_KEY, ACCOUNTS_STORAGE_KEY } from '@/lib/constants';


export default function UsersPage() {
  const { user, accounts, setAccounts } = useAuth();
  const [servicesCount, setServicesCount] = React.useState<Record<string, number>>({});
  
  // State for Add/Edit User Dialog
  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<Account | null>(null);

  // State for Financial Management Dialog
  const [isFinancialDialogOpen, setIsFinancialDialogOpen] = React.useState(false);
  const [selectedFinancialUser, setSelectedFinancialUser] = React.useState<Account | null>(null);
  const [financialAmount, setFinancialAmount] = React.useState('');


  // Form state
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [userRole, setUserRole] = React.useState<Role>('user');
  const [isActive, setIsActive] = React.useState(true);
  const [walletBalance, setWalletBalance] = React.useState('');
  const [allowNegative, setAllowNegative] = React.useState(false);
  const [negativeLimit, setNegativeLimit] = React.useState('');
  
  const tenantUsers = React.useMemo(() => {
    if (user?.role === 'superadmin') {
      // Superadmin sees everyone except themselves
      return (accounts || []).filter(acc => acc.id !== user.id);
    }
    // Regular admin sees non-admin and non-superadmin roles
    return (accounts || []).filter(acc => acc.role !== 'admin' && acc.role !== 'superadmin');
  }, [accounts, user]);


  const { toast } = useToast();

  // Load services count from localStorage
  React.useEffect(() => {
    try {
      const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
      if (storedServices) {
        const services = JSON.parse(storedServices);
        const counts: Record<string, number> = {};
        services.forEach((service: any) => {
          counts[service.userId] = (counts[service.userId] || 0) + 1;
        });
        setServicesCount(counts);
      }
    } catch (error) {
      console.error("Failed to load services data from localStorage", error);
    }
  }, []);


  const resetUserForm = () => {
    setUserName('');
    setUserEmail('');
    setPassword('');
    setUserRole('user');
    setIsActive(true);
    setWalletBalance('');
    setAllowNegative(false);
    setNegativeLimit('');
    setEditingUser(null);
  };

  const handleOpenUserDialog = (user: Account | null = null) => {
    if (user) {
      setEditingUser(user);
      setUserName(user.name);
      setUserEmail(user.email);
      setPassword(''); // Never show existing password
      setUserRole(user.role);
      setIsActive(user.status === 'active');
      setWalletBalance(user.walletBalance !== undefined ? String(user.walletBalance) : '');
      setAllowNegative(user.allowNegativeBalance || false);
      setNegativeLimit(user.negativeBalanceLimit !== undefined ? String(user.negativeBalanceLimit) : '');
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
      toast({
        title: 'خطا',
        description: 'لطفاً نام و ایمیل را وارد کنید.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!editingUser && !password) {
        toast({
            title: 'خطا',
            description: 'برای کاربر جدید، وارد کردن رمز عبور الزامی است.',
            variant: 'destructive',
        });
        return;
    }
    
    let updatedAccounts: Account[];
    if (editingUser) {
      // Prevent changing email to one that already exists (and is not the user's own)
      if (userEmail !== editingUser.email && accounts.some(acc => acc.email === userEmail)) {
          toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
          return;
      }
      const updatedUser: Account = {
        ...editingUser,
        name: userName,
        email: userEmail,
        role: userRole,
        status: isActive ? 'active' : 'inactive',
        walletBalance: parseFloat(walletBalance) || 0,
        allowNegativeBalance: allowNegative,
        negativeBalanceLimit: allowNegative ? (parseFloat(negativeLimit) || 0) : undefined,
        ...(password && { password: password }), // Only update password if a new one is provided
      };
      updatedAccounts = accounts.map(u => (u.id === editingUser.id ? updatedUser : u));
      toast({ title: 'موفقیت‌آمیز', description: 'حساب کاربری با موفقیت ویرایش شد.' });
    } else {
       if (accounts.some(acc => acc.email === userEmail)) {
        toast({ title: 'خطا', description: 'این ایمیل قبلاً ثبت شده است.', variant: 'destructive' });
        return;
      }
      const newAccount: Account = {
        id: `${userRole}-${new Date().toISOString()}`,
        name: userName,
        email: userEmail,
        password: password,
        role: userRole,
        status: isActive ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        walletBalance: parseFloat(walletBalance) || 0,
        allowNegativeBalance: allowNegative,
        negativeBalanceLimit: allowNegative ? (parseFloat(negativeLimit) || 0) : undefined,
        ...(userRole === 'agent' && { code: generateAgentCode(userName) }),
      };
      updatedAccounts = [...accounts, newAccount];
      toast({ title: 'موفقیت‌آمیز', description: 'حساب کاربری جدید با موفقیت اضافه شد.' });
    }

    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    setIsUserDialogOpen(false);
    resetUserForm();
  };

  const handleDeleteUser = (userId: string) => {
    const updatedAccounts = accounts.filter(u => u.id !== userId)
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    toast({ title: 'موفقیت‌آمیز', description: 'حساب کاربری مورد نظر حذف شد.' });
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

  const getRoleBadge = (role: Role) => {
    switch (role) {
        case 'superadmin':
            return <Badge variant="destructive" className="bg-purple-600 hover:bg-purple-600/80"><ShieldAlert className="w-3 h-3 ml-1" /> ادمین کل</Badge>;
        case 'admin':
            return <Badge variant="destructive"><UserCheck className="w-3 h-3 ml-1" /> ادمین</Badge>;
        case 'agent':
            return <Badge variant="secondary"><UserCog className="w-3 h-3 ml-1" /> نماینده</Badge>;
        case 'supporter':
            return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80"><LifeBuoy className="w-3 h-3 ml-1" /> پشتیبان</Badge>;
        case 'user':
            return <Badge variant="outline"><Users className="w-3 h-3 ml-1" /> کاربر</Badge>;
        default:
            return <Badge variant="outline">نامشخص</Badge>;
    }
  }
  
  const getRoleOptions = () => {
    const options = [
      { value: "user", label: "کاربر" },
      { value: "supporter", label: "پشتیبان" },
      { value: "agent", label: "نماینده" },
    ];

    if (user?.role === 'superadmin') {
      options.push({ value: "admin", label: "ادمین" });
    }

    return options;
  };

  React.useEffect(() => {
    if (!isUserDialogOpen) {
      resetUserForm();
    }
  }, [isUserDialogOpen]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">کاربران</h1>
              <p className="text-muted-foreground">
                لیست تمام حساب‌های کاربری را مدیریت کنید.
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
                  کاربر جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</DialogTitle>
                  <DialogDescription>{editingUser ? 'اطلاعات کاربر را ویرایش کنید.' : 'اطلاعات کاربر جدید را وارد کنید.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">نام</Label>
                    <Input id="user-name" value={userName} onChange={e => setUserName(e.target.value)} placeholder="مثلاً: علی رضایی"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">ایمیل</Label>
                    <Input id="user-email" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="user@example.com"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingUser ? 'برای تغییر، رمز جدید وارد کنید' : 'رمز عبور را وارد کنید'}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-role">نقش</Label>
                    <Select value={userRole} onValueChange={(value) => setUserRole(value as Role)}>
                        <SelectTrigger id="user-role">
                            <SelectValue placeholder="نقش را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                            {getRoleOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wallet-balance">موجودی کیف پول (تومان)</Label>
                    <Input id="wallet-balance" type="number" value={walletBalance} onChange={e => setWalletBalance(e.target.value)} placeholder="موجودی را به تومان وارد کنید"/>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="status">وضعیت</Label>
                    <Switch id="status" checked={isActive} onCheckedChange={setIsActive} dir="ltr" />
                    <span className="text-sm text-muted-foreground">{isActive ? 'فعال' : 'غیرفعال'}</span>
                  </div>
                  <Separator />
                  <Card className="bg-muted/50 p-4">
                     <CardHeader className="p-0 pb-4">
                       <CardTitle className="text-base">مدیریت اعتبار</CardTitle>
                       <CardDescription className="text-xs">
                         به کاربر اجازه دهید تا سقف مشخصی، موجودی منفی داشته باشد.
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
                  <Button onClick={handleSaveUser}>{editingUser ? 'ذخیره تغییرات' : 'افزودن کاربر'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>لیست کاربران</CardTitle>
                  <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="جستجو در کاربران..." className="pl-8" />
                  </div>
              </div>
              <CardDescription>
                  در این جدول می‌توانید لیست کامل کاربران، نمایندگان و پشتیبان‌های این پنل را مشاهده کنید.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام</TableHead>
                  <TableHead>ایمیل</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>کیف پول</TableHead>
                  <TableHead>سرویس‌ها/فروش</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      هیچ کاربری در این پنل وجود ندارد.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenantUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        {u.status === 'active' ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                        ) : (
                          <Badge variant="destructive">غیرفعال</Badge>
                        )}
                      </TableCell>
                      <TableCell className={`font-medium ${(u.walletBalance || 0) < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(u.walletBalance)}
                      </TableCell>
                      <TableCell>{u.role === 'user' ? (servicesCount[u.id] || 0) : (u.salesCount || '-')}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenUserDialog(u)}>
                                    ویرایش
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenFinancialDialog(u)}>
                                    مدیریت مالی
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(u.id)}>
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
                <DialogTitle>مدیریت مالی کاربر</DialogTitle>
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
