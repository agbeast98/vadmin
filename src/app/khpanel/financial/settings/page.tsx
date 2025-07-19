
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, CreditCard, PlusCircle, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { FinancialSettings, BankAccount } from '@/lib/types';
import { setFinancialSettings as saveFinancialSettings } from '@/lib/data-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export default function FinancialSettingsPage() {
    const { financialSettings, setFinancialSettings } = useAuth();
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingAccount, setEditingAccount] = React.useState<BankAccount | null>(null);

    // Form state
    const [cardHolder, setCardHolder] = React.useState('');
    const [cardNumber, setCardNumber] = React.useState('');

    const resetForm = () => {
        setCardHolder('');
        setCardNumber('');
        setEditingAccount(null);
    }

    const handleOpenDialog = (account: BankAccount | null = null) => {
        if (account) {
            setEditingAccount(account);
            setCardHolder(account.cardHolder);
            setCardNumber(account.cardNumber);
        } else {
            if ((financialSettings.accounts || []).length >= 10) {
                toast({ title: 'خطا', description: 'شما نمی‌توانید بیش از ۱۰ شماره کارت اضافه کنید.', variant: 'destructive'});
                return;
            }
            resetForm();
        }
        setIsDialogOpen(true);
    }
    
    React.useEffect(() => {
        if (!isDialogOpen) {
            resetForm();
        }
    }, [isDialogOpen]);

    const handleSaveAccount = async () => {
        if (!cardHolder || !cardNumber) {
            toast({ title: 'خطا', description: 'لطفا نام صاحب حساب و شماره کارت را وارد کنید.', variant: 'destructive'});
            return;
        }

        let updatedAccounts: BankAccount[];
        const currentAccounts = financialSettings.accounts || [];

        if (editingAccount) {
            updatedAccounts = currentAccounts.map(acc => 
                acc.id === editingAccount.id ? { ...acc, cardHolder, cardNumber } : acc
            );
        } else {
            const newAccount: BankAccount = {
                id: `card-${Date.now()}`,
                cardHolder,
                cardNumber
            };
            updatedAccounts = [...currentAccounts, newAccount];
        }

        const newSettings = { accounts: updatedAccounts };
        const result = await saveFinancialSettings(newSettings);
        
        if (result.success) {
            setFinancialSettings(newSettings);
            toast({ title: "موفقیت‌آمیز", description: "اطلاعات حساب با موفقیت ذخیره شد."});
            setIsDialogOpen(false);
        } else {
            toast({ title: 'خطا', description: result.error, variant: 'destructive'});
        }
    }
    
    const handleDeleteAccount = async (accountId: string) => {
        const updatedAccounts = (financialSettings.accounts || []).filter(acc => acc.id !== accountId);
        const newSettings = { accounts: updatedAccounts };
        const result = await saveFinancialSettings(newSettings);
        
        if(result.success) {
            setFinancialSettings(newSettings);
            toast({ title: "موفقیت‌آمیز", description: "حساب مورد نظر حذف شد."});
        } else {
            toast({ title: 'خطا', description: result.error, variant: 'destructive'});
        }
    }

    const accountsList = financialSettings.accounts || [];

  return (
    <>
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">تنظیمات مالی</h1>
                        <p className="text-muted-foreground">
                            اطلاعات حساب‌های بانکی برای نمایش به کاربران را در این بخش مدیریت کنید.
                        </p>
                    </div>
                </div>
                 <Button onClick={() => handleOpenDialog()} disabled={accountsList.length >= 10}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    افزودن کارت جدید
                 </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5"/>لیست حساب‌های بانکی</CardTitle>
                    <CardDescription>
                        این اطلاعات در صفحه افزایش موجودی به کاربران نمایش داده خواهد شد.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>نام صاحب حساب</TableHead>
                                <TableHead>شماره کارت</TableHead>
                                <TableHead className="text-right">عملیات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accountsList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        هیچ کارتی ثبت نشده است.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accountsList.map(acc => (
                                    <TableRow key={acc.id}>
                                        <TableCell className="font-medium">{acc.cardHolder}</TableCell>
                                        <TableCell className="font-mono" dir="ltr">{acc.cardNumber}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(acc)}>
                                                        <Edit className="ml-2 h-4 w-4" />
                                                        ویرایش
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAccount(acc.id)}>
                                                        <Trash2 className="ml-2 h-4 w-4" />
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingAccount ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی جدید'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cardHolder">نام صاحب حساب</Label>
                        <Input 
                            id="cardHolder"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="نام کامل صاحب حساب"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cardNumber">شماره کارت</Label>
                        <Input 
                            id="cardNumber"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            dir="ltr"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveAccount}>
                        <Save className="ml-2 h-4 w-4" />
                        {editingAccount ? 'ذخیره تغییرات' : 'افزودن حساب'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
