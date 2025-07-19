
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Percent, PlusCircle, MoreHorizontal, Trash2, Edit, CalendarIcon } from 'lucide-react';
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
import type { Coupon, CouponUsage } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { COUPONS_STORAGE_KEY, COUPON_USAGE_STORAGE_KEY } from '@/lib/constants';

const initialFormState: Partial<Coupon> = {
  code: '',
  type: 'percentage',
  value: 0,
  usageLimit: 1,
  expiryDate: null,
  status: 'active',
};

export default function CouponsPage() {
  const { toast } = useToast();

  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [couponUsage, setCouponUsage] = React.useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);

  // Form state
  const [formState, setFormState] = React.useState<Partial<Coupon>>(initialFormState);

  React.useEffect(() => {
    try {
      const storedCoupons = localStorage.getItem(COUPONS_STORAGE_KEY);
      if (storedCoupons) setCoupons(JSON.parse(storedCoupons));

      const storedUsage = localStorage.getItem(COUPON_USAGE_STORAGE_KEY);
      if (storedUsage) {
          const usageData: CouponUsage[] = JSON.parse(storedUsage);
          const usageCount = usageData.reduce((acc, usage) => {
              acc[usage.couponId] = (acc[usage.couponId] || 0) + 1;
              return acc;
          }, {} as Record<string, number>);
          setCouponUsage(usageCount);
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری اطلاعات کوپن‌ها رخ داد.', variant: 'destructive' });
    }
  }, [toast]);

  const updateCouponsState = (updatedCoupons: Coupon[]) => {
    setCoupons(updatedCoupons);
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(updatedCoupons));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingCoupon(null);
  };

  const handleOpenDialog = (coupon: Coupon | null = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormState({
        ...coupon,
        expiryDate: coupon.expiryDate ? parseISO(coupon.expiryDate) : null,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = () => {
    if (!formState.code || !formState.type || formState.value === undefined || formState.usageLimit === undefined) {
      toast({ title: 'خطا', description: 'لطفاً تمام فیلدهای ضروری را پر کنید.', variant: 'destructive' });
      return;
    }

    const finalCouponData: Coupon = {
        ...initialFormState,
        ...formState,
        id: editingCoupon?.id || `coupon-${Date.now()}`,
        expiryDate: formState.expiryDate ? (formState.expiryDate as Date).toISOString() : null,
    } as Coupon;


    let updatedCoupons: Coupon[];
    if (editingCoupon) {
      updatedCoupons = coupons.map(c => (c.id === editingCoupon.id ? finalCouponData : c));
      toast({ title: 'موفقیت‌آمیز', description: 'کوپن با موفقیت ویرایش شد.' });
    } else {
      if(coupons.some(c => c.code.toLowerCase() === finalCouponData.code.toLowerCase())) {
        toast({ title: 'خطا', description: 'کد تخفیف وارد شده تکراری است.', variant: 'destructive' });
        return;
      }
      updatedCoupons = [...coupons, finalCouponData];
      toast({ title: 'موفقیت‌آمیز', description: 'کوپن جدید با موفقیت اضافه شد.' });
    }

    updateCouponsState(updatedCoupons);
    setIsDialogOpen(false);
  };

  const handleDeleteCoupon = (couponId: string) => {
    // Note: This doesn't delete usage history, just the coupon itself.
    const updatedCoupons = coupons.filter(c => c.id !== couponId);
    updateCouponsState(updatedCoupons);
    toast({ title: 'موفقیت‌آمیز', description: 'کوپن مورد نظر حذف شد.' });
  };

  React.useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'نامحدود';
    try {
      return format(parseISO(dateString), 'yyyy/MM/dd');
    } catch {
      return 'نامعتبر';
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Percent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">کدهای تخفیف</h1>
              <p className="text-muted-foreground">
                کدهای تخفیف برای مشتریان خود ایجاد و مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  کوپن جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCoupon ? 'ویرایش کوپن' : 'افزودن کوپن جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="coupon-code">کد تخفیف</Label>
                    <Input id="coupon-code" value={formState.code} onChange={e => setFormState(p => ({...p, code: e.target.value}))} placeholder="مثلاً: EID1404" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="coupon-type">نوع</Label>
                        <Select value={formState.type} onValueChange={(value: 'percentage' | 'amount') => setFormState(p => ({...p, type: value}))}>
                            <SelectTrigger id="coupon-type"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">درصدی</SelectItem>
                                <SelectItem value="amount">مبلغی</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="coupon-value">مقدار</Label>
                        <Input id="coupon-value" type="number" value={formState.value} onChange={e => setFormState(p => ({...p, value: Number(e.target.value)}))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage-limit">سقف استفاده</Label>
                    <Input id="usage-limit" type="number" value={formState.usageLimit} onChange={e => setFormState(p => ({...p, usageLimit: Number(e.target.value)}))} placeholder="تعداد دفعات قابل استفاده" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="expiry-date">تاریخ انقضا (اختیاری)</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-right font-normal",
                              !formState.expiryDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {formState.expiryDate ? format(formState.expiryDate as Date, "PPP") : <span>تاریخ را انتخاب کنید</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formState.expiryDate as Date | undefined}
                            onSelect={(date) => setFormState(p => ({...p, expiryDate: date || null}))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="status">وضعیت</Label>
                    <Switch id="status" checked={formState.status === 'active'} onCheckedChange={(checked) => setFormState(p => ({...p, status: checked ? 'active' : 'inactive'}))} dir="ltr" />
                    <span className="text-sm text-muted-foreground">{formState.status === 'active' ? 'فعال' : 'غیرفعال'}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveCoupon}>{editingCoupon ? 'ذخیره تغییرات' : 'افزودن کوپن'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست کوپن‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>مقدار</TableHead>
                  <TableHead>استفاده / سقف</TableHead>
                  <TableHead>تاریخ انقضا</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      هنوز هیچ کوپنی ایجاد نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map(coupon => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium font-mono">{coupon.code}</TableCell>
                      <TableCell>{coupon.type === 'percentage' ? 'درصدی' : 'مبلغی'}</TableCell>
                      <TableCell>
                        {coupon.type === 'percentage' 
                          ? `${coupon.value}%`
                          : `${coupon.value.toLocaleString('fa-IR')} تومان`
                        }
                      </TableCell>
                      <TableCell>
                         <Badge variant="secondary">{couponUsage[coupon.id] || 0}</Badge>
                         <span className="mx-1">/</span>
                         <Badge variant="outline">{coupon.usageLimit}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(coupon.expiryDate)}</TableCell>
                      <TableCell>
                        {coupon.status === 'active' ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                        ) : (
                          <Badge variant="destructive">غیرفعال</Badge>
                        )}
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(coupon)}>
                              <Edit className="mr-2 h-4 w-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCoupon(coupon.id)}>
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
