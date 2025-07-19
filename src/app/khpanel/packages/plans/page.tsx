
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, PlusCircle, MoreHorizontal, Trash2, Edit, Server, Package, Link2, PackagePlus } from 'lucide-react';
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
import type { Plan, Category, Server as ServerType, PreMadeItemGroup } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PLANS_STORAGE_KEY, CATEGORIES_STORAGE_KEY, SERVERS_STORAGE_KEY, PRE_MADE_ITEM_GROUPS_STORAGE_KEY } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const initialFormState: Partial<Plan> = {
  name: '',
  categoryId: '',
  price: 0,
  agentPrice: 0,
  durationDays: 30,
  postPurchaseInfo: '',
  status: 'active',
  provisionType: 'auto',
  serverId: '',
  preMadeItemGroupId: '',
  protocol: 'vless',
  volumeGB: 0,
  inboundId: '',
  connectionDomain: '',
  connectionPort: '',
  remark: '{email}',
};

export default function PlansPage() {
  const { toast } = useToast();

  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [servers, setServers] = React.useState<ServerType[]>([]);
  const [preMadeGroups, setPreMadeGroups] = React.useState<PreMadeItemGroup[]>([]);

  const [isPlanDialogOpen, setIsPlanDialogOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);

  // Form state
  const [formState, setFormState] = React.useState<Partial<Plan>>(initialFormState);

  React.useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
      if (storedPlans) setPlans(JSON.parse(storedPlans));

      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) setCategories(JSON.parse(storedCategories));

      const storedServers = localStorage.getItem(SERVERS_STORAGE_KEY);
      if (storedServers) setServers(JSON.parse(storedServers));
      
      const storedGroups = localStorage.getItem(PRE_MADE_ITEM_GROUPS_STORAGE_KEY);
      if (storedGroups) setPreMadeGroups(JSON.parse(storedGroups));

    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری اطلاعات اولیه رخ داد.', variant: 'destructive' });
    }
  }, [toast]);

  const updatePlansState = (updatedPlans: Plan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(updatedPlans));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingPlan(null);
  };

  const handleOpenPlanDialog = (plan: Plan | null = null) => {
    if (plan) {
      setEditingPlan(plan);
      const stateToSet = { ...initialFormState, ...plan };
      setFormState(stateToSet);
    } else {
      resetForm();
    }
    setIsPlanDialogOpen(true);
  };
  
  const handleFormChange = (field: keyof Plan, value: any) => {
      setFormState(prev => ({ ...prev, [field]: value }));
  }

  const handleSavePlan = () => {
    if (!formState.name || !formState.categoryId || formState.price === undefined || formState.durationDays === undefined) {
      toast({ title: 'خطا', description: 'لطفاً تمام فیلدهای ضروری را پر کنید.', variant: 'destructive' });
      return;
    }
    
    if (formState.provisionType === 'auto' && !formState.serverId) {
       toast({ title: 'خطا', description: 'برای تحویل خودکار، انتخاب سرور الزامی است.', variant: 'destructive' });
      return;
    }
    
     if (formState.provisionType === 'pre-made' && !formState.preMadeItemGroupId) {
       toast({ title: 'خطا', description: 'برای تحویل از موجودی آماده، انتخاب گروه آیتم الزامی است.', variant: 'destructive' });
      return;
    }

    let updatedPlans: Plan[];
    if (editingPlan) {
      const updatedPlan = { ...editingPlan, ...formState } as Plan;
      updatedPlans = plans.map(p => (p.id === editingPlan.id ? updatedPlan : p));
      toast({ title: 'موفقیت‌آمیز', description: 'پلن با موفقیت ویرایش شد.' });
    } else {
      const newPlan: Plan = {
        id: `plan-${Date.now()}`,
        ...formState,
      } as Plan;
      updatedPlans = [...plans, newPlan];
      toast({ title: 'موفقیت‌آمیز', description: 'پلن جدید با موفقیت اضافه شد.' });
    }

    updatePlansState(updatedPlans);
    setIsPlanDialogOpen(false);
    resetForm();
  };

  const handleDeletePlan = (planId: string) => {
    const updatedPlans = plans.filter(p => p.id !== planId);
    updatePlansState(updatedPlans);
    toast({ title: 'موفقیت‌آمیز', description: 'پلن مورد نظر حذف شد.' });
  };
  
  React.useEffect(() => {
    if (!isPlanDialogOpen) {
      resetForm();
    }
  }, [isPlanDialogOpen]);
  
  const getCategoryName = (categoryId: string) => {
      return categories.find(c => c.id === categoryId)?.name || 'نامشخص';
  }
  
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('fa-IR').format(amount);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت پلن‌ها</h1>
              <p className="text-muted-foreground">
                پلن‌های فروش سرویس را ایجاد و مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenPlanDialog()}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  پلن جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? 'ویرایش پلن' : 'افزودن پلن جدید'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-4">
                  <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>اطلاعات پایه</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="plan-name">نام پلن</Label>
                                <Input id="plan-name" value={formState.name || ''} onChange={e => handleFormChange('name', e.target.value)} placeholder="مثلاً: پلن ۱ ماهه ویژه" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="category-id">دسته‌بندی</Label>
                                <Select value={formState.categoryId || ''} onValueChange={(value) => handleFormChange('categoryId', value)}>
                                  <SelectTrigger id="category-id">
                                    <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.filter(c => c.status === 'active').map(cat => (
                                       <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">قیمت (تومان)</Label>
                                <Input id="price" type="number" value={formState.price || 0} onChange={e => handleFormChange('price', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="agent-price">قیمت برای نماینده (تومان)</Label>
                                <Input id="agent-price" type="number" value={formState.agentPrice || ''} onChange={e => handleFormChange('agentPrice', Number(e.target.value))} placeholder="اختیاری"/>
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="duration-days">مدت اعتبار (روز)</Label>
                                <Input id="duration-days" type="number" value={formState.durationDays || 0} onChange={e => handleFormChange('durationDays', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="post-purchase-info">اطلاعات پس از خرید</Label>
                                <Textarea id="post-purchase-info" value={formState.postPurchaseInfo || ''} onChange={e => handleFormChange('postPurchaseInfo', e.target.value)} placeholder="اطلاعاتی که پس از خرید به کاربر نمایش داده می‌شود."/>
                            </div>
                             <div className="flex items-center gap-4 md:col-span-2">
                                <Label htmlFor="status">وضعیت پلن</Label>
                                <Switch id="status" checked={formState.status === 'active'} onCheckedChange={(checked) => handleFormChange('status', checked ? 'active' : 'inactive')} dir="ltr" />
                                <span className="text-sm text-muted-foreground">{formState.status === 'active' ? 'فعال' : 'غیرفعال'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>نحوه تحویل سرویس</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <RadioGroup
                                value={formState.provisionType}
                                onValueChange={(value: 'auto' | 'pre-made') => handleFormChange('provisionType', value)}
                                className="grid grid-cols-2 gap-4"
                              >
                                <div>
                                  <RadioGroupItem value="auto" id="auto" className="peer sr-only" />
                                  <Label
                                    htmlFor="auto"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <Server className="mb-3 h-6 w-6" />
                                    تحویل خودکار
                                  </Label>
                                </div>
                                <div>
                                  <RadioGroupItem value="pre-made" id="pre-made" className="peer sr-only" />
                                  <Label
                                    htmlFor="pre-made"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                  >
                                    <PackagePlus className="mb-3 h-6 w-6" />
                                    از موجودی آماده
                                  </Label>
                                </div>
                              </RadioGroup>
                        </CardContent>
                    </Card>

                    {formState.provisionType === 'auto' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />تنظیمات اتصال خودکار</CardTitle>
                                <CardDescription>
                                    پارامترهای لازم برای ساخت لینک اتصال کاربر را مشخص کنید.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="server-id">سرور</Label>
                                        <Select value={formState.serverId || ''} onValueChange={(value) => handleFormChange('serverId', value)}>
                                          <SelectTrigger id="server-id">
                                            <SelectValue placeholder="سرور مورد نظر را انتخاب کنید" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {servers.map(server => (
                                               <SelectItem key={server.id} value={server.id}>{server.name} ({server.panelType})</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="protocol">پروتکل</Label>
                                        <Select value={formState.protocol || 'vless'} onValueChange={(value) => handleFormChange('protocol', value)}>
                                            <SelectTrigger id="protocol"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="vless">VLESS</SelectItem>
                                                <SelectItem value="vmess">VMess</SelectItem>
                                                <SelectItem value="trojan">Trojan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="volume-gb">حجم (GB)</Label>
                                        <Input id="volume-gb" type="number" value={formState.volumeGB || 0} onChange={e => handleFormChange('volumeGB', Number(e.target.value))} placeholder="0 برای نامحدود"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inbound-id">شناسه اینباند (ID)</Label>
                                        <Input id="inbound-id" value={formState.inboundId || ''} onChange={e => handleFormChange('inboundId', e.target.value)} placeholder="ID اینباند در پنل X-UI"/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="remark">نام کاربری (Remark)</Label>
                                        <Input id="remark" value={formState.remark || ''} onChange={e => handleFormChange('remark', e.target.value)} placeholder="مثلاً: {name}-{id}"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="connection-domain">دامنه اتصال</Label>
                                        <Input id="connection-domain" value={formState.connectionDomain || ''} onChange={e => handleFormChange('connectionDomain', e.target.value)} placeholder="de.example.com"/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="connection-port">پورت اتصال</Label>
                                        <Input id="connection-port" type="number" value={formState.connectionPort || ''} onChange={e => handleFormChange('connectionPort', e.target.value)} placeholder="مثلاً: 2097"/>
                                    </div>
                                 </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {formState.provisionType === 'pre-made' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />تنظیمات موجودی آماده</CardTitle>
                                 <CardDescription>
                                    گروه آیتم‌هایی که از انبار برای این پلن استفاده می‌شود را انتخاب کنید.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="pre-made-group-id">گروه موجودی</Label>
                                    <Select value={formState.preMadeItemGroupId || ''} onValueChange={(value) => handleFormChange('preMadeItemGroupId', value)}>
                                        <SelectTrigger id="pre-made-group-id">
                                            <SelectValue placeholder="گروه آیتم‌ها را انتخاب کنید" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {preMadeGroups.map(group => (
                                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button onClick={handleSavePlan}>{editingPlan ? 'ذخیره تغییرات' : 'افزودن پلن'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست پلن‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام پلن</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>قیمت</TableHead>
                  <TableHead>قیمت نماینده</TableHead>
                  <TableHead>مدت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      هنوز هیچ پلنی ایجاد نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{getCategoryName(plan.categoryId)}</TableCell>
                      <TableCell>{formatCurrency(plan.price)} تومان</TableCell>
                      <TableCell>{formatCurrency(plan.agentPrice)} تومان</TableCell>
                      <TableCell>{plan.durationDays} روز</TableCell>
                      <TableCell>
                        {plan.status === 'active' ? (
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
                            <DropdownMenuItem onClick={() => handleOpenPlanDialog(plan)}>
                              <Edit className="mr-2 h-4 w-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePlan(plan.id)}>
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
