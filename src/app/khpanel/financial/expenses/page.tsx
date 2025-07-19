
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wallet, PlusCircle, MoreHorizontal, Trash2, Edit, CalendarIcon } from 'lucide-react';
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
import type { Expense } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';

const initialFormState: Partial<Expense> = {
  title: '',
  amount: 0,
  category: '',
  date: new Date().toISOString(),
  description: '',
};

export default function ExpensesPage() {
  const { toast } = useToast();

  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  // Form state
  const [formState, setFormState] = React.useState<Partial<Expense>>(initialFormState);

  React.useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (storedExpenses) {
          const sortedExpenses = JSON.parse(storedExpenses).sort((a: Expense, b: Expense) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setExpenses(sortedExpenses);
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری هزینه‌ها رخ داد.', variant: 'destructive' });
    }
  }, [toast]);

  const updateExpensesState = (updatedExpenses: Expense[]) => {
    const sortedExpenses = updatedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(sortedExpenses);
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(sortedExpenses));
  };

  const resetForm = () => {
    setFormState({ ...initialFormState, date: new Date().toISOString() });
    setEditingExpense(null);
  };

  const handleOpenDialog = (expense: Expense | null = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormState({
        ...expense,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveExpense = () => {
    if (!formState.title || !formState.category || formState.amount === undefined || !formState.date) {
      toast({ title: 'خطا', description: 'لطفاً تمام فیلدهای ضروری را پر کنید.', variant: 'destructive' });
      return;
    }
    
    if (formState.amount <= 0) {
        toast({ title: 'خطا', description: 'مبلغ هزینه باید بیشتر از صفر باشد.', variant: 'destructive' });
        return;
    }

    const finalExpenseData: Expense = {
        ...initialFormState,
        ...formState,
        id: editingExpense?.id || `exp-${Date.now()}`,
    } as Expense;


    let updatedExpenses: Expense[];
    if (editingExpense) {
      updatedExpenses = expenses.map(e => (e.id === editingExpense.id ? finalExpenseData : e));
      toast({ title: 'موفقیت‌آمیز', description: 'هزینه با موفقیت ویرایش شد.' });
    } else {
      updatedExpenses = [...expenses, finalExpenseData];
      toast({ title: 'موفقیت‌آمیز', description: 'هزینه جدید با موفقیت ثبت شد.' });
    }

    updateExpensesState(updatedExpenses);
    setIsDialogOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
    updateExpensesState(updatedExpenses);
    toast({ title: 'موفقیت‌آمیز', description: 'هزینه مورد نظر حذف شد.' });
  };

  React.useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'نامشخص';
    try {
      return format(parseISO(dateString), 'yyyy/MM/dd');
    } catch {
      return 'نامعتبر';
    }
  }
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">مدیریت هزینه‌ها</h1>
                    <p className="text-muted-foreground">
                        هزینه‌های جاری کسب‌وکار خود را در این بخش ثبت و مدیریت کنید.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        هزینه جدید
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                        <DialogTitle>{editingExpense ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label htmlFor="expense-title">عنوان هزینه</Label>
                                <Input id="expense-title" value={formState.title} onChange={e => setFormState(p => ({...p, title: e.target.value}))} placeholder="مثلاً: هزینه سرور ماهانه" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expense-amount">مبلغ (تومان)</Label>
                                    <Input id="expense-amount" type="number" value={formState.amount || ''} onChange={e => setFormState(p => ({...p, amount: Number(e.target.value)}))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expense-category">دسته‌بندی</Label>
                                    <Input id="expense-category" value={formState.category} onChange={e => setFormState(p => ({...p, category: e.target.value}))} placeholder="مثلاً: زیرساخت" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expense-date">تاریخ ثبت</Label>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-right font-normal",
                                        !formState.date && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {formState.date ? format(parseISO(formState.date), "PPP") : <span>تاریخ را انتخاب کنید</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={formState.date ? parseISO(formState.date) : undefined}
                                    onSelect={(date) => setFormState(p => ({...p, date: date?.toISOString() || ''}))}
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="expense-description">توضیحات (اختیاری)</Label>
                                <Textarea id="expense-description" value={formState.description} onChange={e => setFormState(p => ({...p, description: e.target.value}))} placeholder="توضیحات بیشتر در مورد این هزینه..."/>
                             </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveExpense}>{editingExpense ? 'ذخیره تغییرات' : 'ثبت هزینه'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست هزینه‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>مبلغ (تومان)</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      هنوز هیچ هزینه‌ای ثبت نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>
                              <Edit className="mr-2 h-4 w-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteExpense(expense.id)}>
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
