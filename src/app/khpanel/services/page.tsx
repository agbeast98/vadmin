
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Layers3, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Eye, Copy, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Service, Account, Plan, Category, Coupon, Server, TrafficInfo, PreMadeItem, Invoice } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { SERVICES_STORAGE_KEY, ACCOUNTS_STORAGE_KEY, PLANS_STORAGE_KEY, CATEGORIES_STORAGE_KEY, COUPONS_STORAGE_KEY, SERVERS_STORAGE_KEY, PRE_MADE_ITEMS_STORAGE_KEY, INVOICES_STORAGE_KEY, COUPON_USAGE_STORAGE_KEY } from '@/lib/constants';
import { addDays, format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { provisionService } from '@/lib/provisioning';
import { addLog } from '@/lib/logger';
import QRCode from 'qrcode.react';
import { renewServiceOnPanel, getClientTraffic, deleteServiceFromPanel } from '@/lib/actions';


export default function ServicesPage() {
  const { user, accounts, setAccounts, panelSettings } = useAuth();
  const { toast } = useToast();

  // Data states
  const [services, setServices] = React.useState<Service[]>([]);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [allServers, setAllServers] = React.useState<Server[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);


  // Dialog states
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = React.useState(false);
  const [serviceToRenew, setServiceToRenew] = React.useState<Service | null>(null);
  const [trafficInfo, setTrafficInfo] = React.useState<TrafficInfo | null>(null);
  const [isFetchingTraffic, setIsFetchingTraffic] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [serviceToDelete, setServiceToDelete] = React.useState<Service | null>(null);
  
  // Form state
  const [formState, setFormState] = React.useState({
    userId: '',
    categoryId: '',
    planId: '',
    couponCode: '',
    finalPrice: 0,
    clientIdentifier: '',
  });
  
  const [renewalState, setRenewalState] = React.useState({
    planId: '',
    finalPrice: 0,
  });


  React.useEffect(() => {
    try {
      const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
      if (storedServices) setServices(JSON.parse(storedServices));

      const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
      if (storedPlans) setPlans(JSON.parse(storedPlans));

      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) setCategories(JSON.parse(storedCategories));
      
      const storedCoupons = localStorage.getItem(COUPONS_STORAGE_KEY);
      if (storedCoupons) setCoupons(JSON.parse(storedCoupons));

      const storedServers = localStorage.getItem(SERVERS_STORAGE_KEY);
      if (storedServers) setAllServers(JSON.parse(storedServers));

    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری اطلاعات رخ داد.', variant: 'destructive' });
    }
  }, [toast]);
  
  const updateServicesState = (updatedServices: Service[]) => {
    setServices(updatedServices);
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(updatedServices));
  };
  
  const getAccount = React.useCallback((accountId: string) => {
    return accounts.find(a => a.id === accountId);
  }, [accounts]);
  
  const getPlan = React.useCallback((planId: string) => {
    return plans.find(p => p.id === planId);
  }, [plans]);

  const isAdminView = user?.role === 'admin' || user?.role === 'superadmin';
  const isSupporterView = user?.role === 'supporter' && user.supporterPermissions?.canViewServices;


  const displayedServices = React.useMemo(() => {
    if (!user) return [];
    if (isAdminView || isSupporterView) {
      return services;
    }
    // Users and agents see their own services
    return services.filter(s => s.userId === user.id);
  }, [user, services, isAdminView, isSupporterView]);

  const resetForm = () => {
    setFormState({
        userId: '',
        categoryId: '',
        planId: '',
        couponCode: '',
        finalPrice: 0,
        clientIdentifier: '',
    });
    setEditingService(null);
  }
  
  const resetRenewForm = () => {
    setRenewalState({
      planId: '',
      finalPrice: 0
    });
    setServiceToRenew(null);
  }

  const handleOpenServiceDialog = (service: Service | null = null) => {
    if (service) { // Editing existing service
        setEditingService(service);
        const plan = getPlan(service.planId);
        setFormState({
            userId: service.userId,
            planId: service.planId,
            categoryId: plan?.categoryId || '',
            couponCode: service.appliedCouponCode || '',
            finalPrice: service.finalPrice !== undefined ? service.finalPrice : (plan?.price || 0),
            clientIdentifier: service.clientEmail || '',
        });
    } else { // Creating new service
        resetForm();
        if (user && !isAdminView && !isSupporterView) {
          // For users/agents, auto-select themselves
          setFormState(prev => ({ ...prev, userId: user.id }));
        }
    }
    setIsServiceDialogOpen(true);
  }
  
  const handleOpenDetailsDialog = async (service: Service) => {
    setSelectedService(service);
    setIsDetailsDialogOpen(true);
    setTrafficInfo(null);
    
    if (service.serverId && service.clientEmail) {
        setIsFetchingTraffic(true);
        const server = allServers.find(s => s.id === service.serverId);
        if (server) {
            const result = await getClientTraffic(service, server);
            
            if (result.logs && result.logs.length > 0) {
              const errorLogs = result.logs.filter(l => l.startsWith('ERROR:')).join('\n');
              // No longer showing toast for logs automatically
            }
            
            if (result.success && result.data) {
                setTrafficInfo(result.data);
            } else if (!result.success) {
                toast({ title: 'خطا', description: result.error || 'دریافت اطلاعات ترافیک ناموفق بود.', variant: 'destructive'});
            }
        } else {
            toast({ title: 'خطا', description: 'سرور این سرویس یافت نشد.', variant: 'destructive'});
        }
        setIsFetchingTraffic(false);
    }
  }
  
   const handleOpenRenewDialog = (service: Service) => {
    setServiceToRenew(service);
    setIsRenewDialogOpen(true);
  };
  
  const calculateFinalPrice = React.useCallback(() => {
    const plan = getPlan(formState.planId);
    if (!plan) return 0;
    
    // Determine whose price to use (agent or regular)
    const targetUser = getAccount(formState.userId);
    let price = plan.price;
    if (targetUser?.role === 'agent' && plan.agentPrice !== undefined && plan.agentPrice !== null) {
      price = plan.agentPrice;
    }

    const coupon = coupons.find(c => c.code === formState.couponCode && c.status === 'active' && (!c.expiryDate || parseISO(c.expiryDate) > new Date()));
    if(coupon) {
        if(coupon.type === 'percentage') {
            price = price * (1 - coupon.value / 100);
        } else {
            price = Math.max(0, price - coupon.value);
        }
    }
    return price;
  }, [formState.planId, formState.userId, formState.couponCode, plans, coupons, getPlan, getAccount]);

  React.useEffect(() => {
    setFormState(prev => ({...prev, finalPrice: calculateFinalPrice() }));
  }, [formState.planId, formState.userId, formState.couponCode, calculateFinalPrice]);
  
   React.useEffect(() => {
    if (serviceToRenew && renewalState.planId) {
      const plan = getPlan(renewalState.planId);
      const targetUser = getAccount(serviceToRenew.userId);

      if (plan && targetUser) {
        let price = plan.price;
        if (targetUser.role === 'agent' && plan.agentPrice !== undefined && plan.agentPrice !== null) {
            price = plan.agentPrice;
        }
        setRenewalState(prev => ({...prev, finalPrice: price }));
      }
    }
  }, [serviceToRenew, renewalState.planId, getPlan, getAccount]);


  const handleSaveService = async () => {
    if ((isAdminView || isSupporterView) && !formState.userId || !formState.planId) {
        toast({ title: 'خطا', description: 'لطفا کاربر و پلن را انتخاب کنید.', variant: 'destructive' });
        return;
    }
    
    if (!user) return;

    const targetUserId = (isAdminView || isSupporterView) ? formState.userId : user.id;
    const actor = getAccount(targetUserId); // The one who will be charged

    if(!actor) {
        toast({ title: 'خطا', description: 'کاربر مورد نظر یافت نشد.', variant: 'destructive' });
        return;
    }
    
    // For new services, check the total service limit
    if (!editingService && panelSettings.totalServiceLimit) {
        if (services.length >= panelSettings.totalServiceLimit) {
            toast({ title: 'محدودیت سرویس', description: `سقف کل سرویس‌های پنل (${panelSettings.totalServiceLimit}) پر شده است.`, variant: 'destructive' });
            return;
        }
    }

    const selectedPlan = getPlan(formState.planId);
    if (!selectedPlan) {
        toast({ title: 'خطا', description: 'پلن انتخاب شده معتبر نیست.', variant: 'destructive' });
        return;
    }
    
    // Wallet balance check
    const currentBalance = actor.walletBalance || 0;
    const creditLimit = actor.allowNegativeBalance ? (actor.negativeBalanceLimit || 0) : 0;
    
    if ((currentBalance - formState.finalPrice) < -creditLimit) {
        toast({ title: 'موجودی ناکافی', description: `موجودی کیف پول برای خرید این سرویس کافی نیست.`, variant: 'destructive' });
        return;
    }
    
    setIsProcessing(true);
    addLog('info', 'ServiceProvisioning', `Starting to provision service for user: ${actor.name}, plan: ${selectedPlan.name}`);

    if (editingService) {
        // Logic for editing is simplified as provisioning is not re-triggered.
        addLog('warn', 'ServiceProvisioning', 'Editing existing service - provisioning is not re-triggered. Wallet is not deducted on edit.');
        const updatedService: Service = {
            ...editingService,
            userId: formState.userId,
            planId: formState.planId,
            categoryId: selectedPlan.categoryId,
            finalPrice: formState.finalPrice,
            // Note: Expiry date is NOT changed on simple edit. Use Renew for that.
            appliedCouponCode: formState.couponCode || undefined,
            clientEmail: formState.clientIdentifier || editingService.clientEmail,
        };
        const updatedServices = services.map(s => s.id === editingService.id ? updatedService : s);
        toast({ title: 'موفقیت', description: 'سرویس با موفقیت ویرایش شد.' });
        updateServicesState(updatedServices);
    } else {
        // Logic for creating a new service
        let serviceData: Partial<Service> = {
            userId: targetUserId,
            planId: formState.planId,
            categoryId: selectedPlan.categoryId,
            createdAt: new Date().toISOString(),
            expiresAt: addDays(new Date(), selectedPlan.durationDays).toISOString(),
            finalPrice: formState.finalPrice,
            appliedCouponCode: formState.couponCode || undefined,
        };

        if (selectedPlan.provisionType === 'pre-made') {
            try {
                const allItemsStr = localStorage.getItem(PRE_MADE_ITEMS_STORAGE_KEY);
                const allItems: PreMadeItem[] = allItemsStr ? JSON.parse(allItemsStr) : [];
                
                const availableItemIndex = allItems.findIndex(item => 
                    item.groupId === selectedPlan.preMadeItemGroupId && item.status === 'available'
                );
                
                if (availableItemIndex === -1) {
                    toast({ title: 'خطای موجودی', description: 'موجودی این گروه از آیتم‌های آماده به اتمام رسیده است.', variant: 'destructive' });
                    setIsProcessing(false);
                    return;
                }
                
                const itemToSell = { ...allItems[availableItemIndex] };
                itemToSell.status = 'sold';
                itemToSell.userId = targetUserId;
                itemToSell.soldAt = new Date().toISOString();
                
                const updatedItems = [...allItems];
                updatedItems[availableItemIndex] = itemToSell;

                localStorage.setItem(PRE_MADE_ITEMS_STORAGE_KEY, JSON.stringify(updatedItems));

                serviceData.preMadeItemId = itemToSell.id;
                serviceData.configLink = itemToSell.content;
                toast({ title: 'موفقیت', description: 'آیتم از موجودی آماده با موفقیت تخصیص یافت.' });

            } catch (e) {
                console.error("Failed to assign pre-made item from localStorage", e);
                toast({ title: 'خطا', description: 'خطا در دسترسی به موجودی آماده.', variant: 'destructive' });
                setIsProcessing(false);
                return;
            }

        } else if (selectedPlan.provisionType === 'auto') {
            const provisionResult = await provisionService(serviceData as Service, selectedPlan, actor, allServers, formState.clientIdentifier);
            
            (provisionResult.logs || []).forEach(log => {
                const level = log.startsWith('ERROR:') ? 'error' : log.startsWith('WARN:') ? 'warn' : 'info';
                addLog(level, 'ServiceProvisioning', log.replace(/^(ERROR:|WARN:|INFO:)\s*/, ''));
            });

            if (!provisionResult.success || !provisionResult.serviceData) {
                toast({ title: 'خطا در ساخت سرویس', description: provisionResult.error, variant: 'destructive' });
                setIsProcessing(false);
                return;
            }
            serviceData = { ...serviceData, ...provisionResult.serviceData };
            toast({ title: 'موفقیت', description: `سرویس با موفقیت ایجاد شد. ${provisionResult.message || ''}` });
        }
        
        const newService: Service = { id: `service-${Date.now()}`, ...serviceData } as Service;
        const updatedServices = [newService, ...services];
        updateServicesState(updatedServices);
        
        // Deduct from wallet and update accounts
        const newBalance = currentBalance - formState.finalPrice;
        const updatedAccounts = accounts.map(acc => 
            acc.id === actor.id ? { ...acc, walletBalance: newBalance } : acc
        );
        setAccounts(updatedAccounts);
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
        addLog('info', 'Finance', `Deducted ${formState.finalPrice} from user ${actor.name}'s wallet. New balance: ${newBalance}`);

        // Create an invoice for the new service
        try {
            const storedInvoices = localStorage.getItem(INVOICES_STORAGE_KEY);
            const allInvoices: Invoice[] = storedInvoices ? JSON.parse(storedInvoices) : [];
            const newInvoice: Invoice = {
                id: `INV-${Date.now()}`,
                serviceId: newService.id,
                userId: newService.userId,
                amount: newService.finalPrice || 0,
                status: 'paid',
                createdAt: newService.createdAt,
            };
            const updatedInvoices = [newInvoice, ...allInvoices];
            localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(updatedInvoices));
        } catch(e) {
            console.error("Failed to create invoice", e);
            addLog('error', 'Invoicing', 'Failed to create invoice for new service.');
        }

    }
    
    setIsProcessing(false);
    setIsServiceDialogOpen(false);
  }

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    setIsProcessing(true);
    addLog('info', 'ServiceDeletion', `Attempting to delete service ID: ${serviceToDelete.id}`);

    const server = serviceToDelete.serverId ? allServers.find(s => s.id === serviceToDelete.serverId) : undefined;
    
    if (server && serviceToDelete.clientEmail) {
        addLog('info', 'ServiceDeletion', `Service is on server ${server.name}. Deleting from panel.`);
        const result = await deleteServiceFromPanel(serviceToDelete, server, plans);

        (result.logs || []).forEach(log => {
            const level = log.startsWith('ERROR:') ? 'error' : log.startsWith('WARN:') ? 'warn' : 'info';
            addLog(level, 'ServiceDeletion', log.replace(/^(ERROR:|WARN:|INFO:)\s*/, ''));
        });
        
        if (!result.success) {
            toast({
                title: 'خطا در حذف از پنل',
                description: `${result.error} با این حال، سرویس از این لیست حذف می‌شود.`,
                variant: 'destructive',
                duration: 8000,
            });
        } else {
            toast({ title: 'موفقیت', description: 'کاربر با موفقیت از پنل سرور حذف شد.' });
        }
    } else if (serviceToDelete.preMadeItemId) {
        addLog('info', 'ServiceDeletion', `Service is from pre-made stock. Not reverting item status as per new logic.`);
    } else {
        addLog('warn', 'ServiceDeletion', 'Service has no serverId or preMadeItemId, deleting locally only.');
    }

    const updatedServices = services.filter(s => s.id !== serviceToDelete.id);
    updateServicesState(updatedServices);
    
    toast({ title: 'موفقیت', description: 'سرویس با موفقیت از لیست حذف شد.' });
    
    setIsProcessing(false);
    setIsDeleteAlertOpen(false);
    setServiceToDelete(null);
  };
  
  const handleRenewService = async () => {
    if (!serviceToRenew || !renewalState.planId) {
      toast({ title: 'خطا', description: 'لطفا یک پلن برای تمدید انتخاب کنید.', variant: 'destructive' });
      return;
    }
    
    const renewalPlan = getPlan(renewalState.planId);
    if (!renewalPlan) {
      toast({ title: 'خطا', description: 'پلن تمدید نامعتبر است.', variant: 'destructive' });
      return;
    }

    const targetUser = getAccount(serviceToRenew.userId);
    if (!targetUser) {
        toast({ title: 'خطا', description: 'کاربر این سرویس یافت نشد.', variant: 'destructive' });
        return;
    }
    
    // Wallet balance check for renewal
    const currentBalance = targetUser.walletBalance || 0;
    const creditLimit = targetUser.allowNegativeBalance ? (targetUser.negativeBalanceLimit || 0) : 0;
    if ((currentBalance - renewalState.finalPrice) < -creditLimit) {
        toast({ title: 'موجودی ناکافی', description: `موجودی کیف پول کاربر برای تمدید کافی نیست.`, variant: 'destructive' });
        return;
    }

    if (!serviceToRenew.serverId || !serviceToRenew.clientEmail) {
      toast({ title: 'خطا', description: 'این سرویس به صورت خودکار ساخته نشده و قابل تمدید خودکار نیست.', variant: 'destructive' });
      return;
    }
    
    const targetServer = allServers.find(s => s.id === serviceToRenew.serverId);
    if (!targetServer) {
        toast({ title: 'خطا', description: `سرور مربوط به این سرویس (${serviceToRenew.serverId}) یافت نشد.`, variant: 'destructive' });
        return;
    }
    
    setIsProcessing(true);
    addLog('info', 'ServiceRenewal', `Starting renewal for service ${serviceToRenew.id} with plan ${renewalPlan.name}`);

    const result = await renewServiceOnPanel(serviceToRenew, renewalPlan, targetServer);

    (result.logs || []).forEach(log => {
        const level = log.startsWith('ERROR:') ? 'error' : log.startsWith('WARN:') ? 'warn' : 'info';
        addLog(level, 'ServiceRenewal', log.replace(/^(ERROR:|WARN:|INFO:)\s*/, ''));
    });

    if (!result.success) {
        toast({ title: 'خطا در تمدید', description: result.error, variant: 'destructive' });
        setIsProcessing(false);
        return;
    }

    // Deduct from wallet and update accounts
    const newBalance = currentBalance - renewalState.finalPrice;
    const updatedAccounts = accounts.map(acc => 
        acc.id === targetUser.id ? { ...acc, walletBalance: newBalance } : acc
    );
    setAccounts(updatedAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    addLog('info', 'Finance', `Deducted ${renewalState.finalPrice} from user ${targetUser.name}'s wallet for renewal.`);


    const newExpiryDate = addDays(new Date(serviceToRenew.expiresAt), renewalPlan.durationDays);
    
    const updatedService: Service = {
      ...serviceToRenew,
      planId: renewalPlan.id,
      categoryId: renewalPlan.categoryId,
      expiresAt: newExpiryDate.toISOString(),
      finalPrice: renewalState.finalPrice,
      appliedCouponCode: undefined, // Coupons don't apply to renewals in this logic
    };
    
    const updatedServices = services.map(s => s.id === serviceToRenew.id ? updatedService : s);
    updateServicesState(updatedServices);
    
    toast({
      title: 'موفقیت',
      description: `سرویس با موفقیت در پنل به‌روز و تا تاریخ ${newExpiryDate.toLocaleDateString('fa-IR')} تمدید شد.`
    });
    
    setIsProcessing(false);
    setIsRenewDialogOpen(false);
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'کپی شد!', description: 'اطلاعات در کلیپ‌بورد شما کپی شد.' });
  }

  const getStatus = (expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    return isExpired 
        ? <Badge variant="destructive">منقضی شده</Badge>
        : <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
  }
  
  React.useEffect(() => {
    if (!isServiceDialogOpen) resetForm();
  }, [isServiceDialogOpen]);
  
  React.useEffect(() => {
    if (!isRenewDialogOpen) resetRenewForm();
  }, [isRenewDialogOpen]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


  if (!user) {
    return <div>در حال بارگذاری...</div>;
  }
  
  const canCreateService = user.role === 'admin' || user.role === 'superadmin' || user.role === 'supporter' || user.role === 'agent' || user.role === 'user';
  
  const availablePlans = plans.filter(p => p.status === 'active' && (!formState.categoryId || p.categoryId === formState.categoryId));
  const availableRenewalPlans = plans.filter(p => p.status === 'active' && serviceToRenew && p.categoryId === serviceToRenew.categoryId);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);
  
  const userListForForm = React.useMemo(() => {
    if(isAdminView || isSupporterView) {
        return accounts.filter(a => a.role === 'user' || a.role === 'agent');
    }
    return [];
  }, [accounts, isAdminView, isSupporterView]);


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Layers3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {(isAdminView || isSupporterView) ? 'مدیریت سرویس‌ها' : 'سرویس‌های من'}
              </h1>
              <p className="text-muted-foreground">
                {(isAdminView || isSupporterView) ? 'تمام سرویس‌های فروخته شده را مدیریت کنید.' : 'سرویس‌های فعال و منقضی شده خود را مشاهده کنید.'}
              </p>
            </div>
          </div>
          {canCreateService && (
             <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenServiceDialog()}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  ایجاد سرویس
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'ویرایش سرویس' : 'ایجاد سرویس جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {(isAdminView || isSupporterView) && (
                    <div className="space-y-2">
                      <Label htmlFor="user-id">۱. کاربر</Label>
                      <Select value={formState.userId} onValueChange={(value) => setFormState(p => ({...p, userId: value}))} disabled={!!editingService || isProcessing}>
                        <SelectTrigger id="user-id"><SelectValue placeholder="کاربر را انتخاب کنید" /></SelectTrigger>
                        <SelectContent>
                          {userListForForm.map(acc => (
                             <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.email})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                   <div className="space-y-2">
                    <Label htmlFor="category-id">{(isAdminView || isSupporterView) ? '۲.' : '۱.'} دسته‌بندی</Label>
                    <Select value={formState.categoryId} onValueChange={(value) => setFormState(p => ({...p, categoryId: value, planId: ''}))} disabled={!!editingService || isProcessing}>
                      <SelectTrigger id="category-id"><SelectValue placeholder="دسته‌بندی را انتخاب کنید" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.status === 'active').map(cat => (
                           <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-id">{(isAdminView || isSupporterView) ? '۳.' : '۲.'} پلن</Label>
                     <Select value={formState.planId} onValueChange={(value) => setFormState(p => ({...p, planId: value}))} disabled={!formState.categoryId || !!editingService || isProcessing}>
                      <SelectTrigger id="plan-id"><SelectValue placeholder="پلن را انتخاب کنید" /></SelectTrigger>
                      <SelectContent>
                        {availablePlans.map(plan => (
                           <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} ({formatCurrency(
                                (getAccount(formState.userId)?.role === 'agent' && plan.agentPrice !== undefined) ? plan.agentPrice : plan.price
                             )} تومان)
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-identifier">{(isAdminView || isSupporterView) ? '۴.' : '۳.'} شناسه سفارشی (اختیاری)</Label>
                    <Input 
                      id="client-identifier" 
                      value={formState.clientIdentifier} 
                      onChange={e => setFormState(p => ({...p, clientIdentifier: e.target.value}))} 
                      disabled={!formState.planId || isProcessing || !!editingService}
                      placeholder="خالی بگذارید تا خودکار ساخته شود"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="coupon-code">{(isAdminView || isSupporterView) ? '۵.' : '۴.'} کد تخفیف (اختیاری)</Label>
                    <Input id="coupon-code" value={formState.couponCode} onChange={e => setFormState(p => ({...p, couponCode: e.target.value}))} disabled={!formState.planId || isProcessing} />
                  </div>
                  <div className="p-3 bg-muted rounded-md text-center">
                    <p className="text-sm text-muted-foreground">قیمت نهایی:</p>
                    <p className="text-lg font-bold">{formatCurrency(formState.finalPrice)} تومان</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveService} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingService ? 'ذخیره تغییرات' : 'ایجاد سرویس'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>لیست سرویس‌ها</CardTitle>
                  <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="جستجو در سرویس‌ها..." className="pl-8" />
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {(isAdminView || isSupporterView) && <TableHead>کاربر</TableHead>}
                  <TableHead>پلن</TableHead>
                  <TableHead>شناسه</TableHead>
                  <TableHead>تاریخ انقضا</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={(isAdminView || isSupporterView) ? 6 : 5} className="h-24 text-center">
                      هیچ سرویسی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedServices.map(service => {
                    const account = getAccount(service.userId);
                    const plan = getPlan(service.planId);
                    return (
                        <TableRow key={service.id}>
                          {(isAdminView || isSupporterView) && <TableCell className="font-medium">{account?.name || 'کاربر حذف شده'}</TableCell>}
                          <TableCell>{plan?.name || 'پلن حذف شده'}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[150px] truncate" title={service.clientEmail}>{service.clientEmail || '-'}</TableCell>
                          <TableCell>{new Date(service.expiresAt).toLocaleDateString('fa-IR')}</TableCell>
                          <TableCell>{getStatus(service.expiresAt)}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleOpenDetailsDialog(service)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        مشاهده جزئیات
                                    </DropdownMenuItem>
                                    {(isAdminView || isSupporterView) && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleOpenRenewDialog(service)}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                تمدید
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenServiceDialog(service)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                ویرایش
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="text-destructive"
                                                onSelect={(e) => { 
                                                    e.preventDefault(); 
                                                    setServiceToDelete(service);
                                                    setIsDeleteAlertOpen(true);
                                                }}
                                              >
                                                  <Trash2 className="mr-2 h-4 w-4" />
                                                  حذف
                                              </DropdownMenuItem>
                                        </>
                                    )}
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

       <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>جزئیات سرویس</DialogTitle>
                {selectedService && <DialogDescription>اطلاعات کامل سرویس خریداری شده.</DialogDescription>}
            </DialogHeader>
            {selectedService && (
                <div className="grid gap-4 py-4 text-sm">
                    {selectedService.configLink && (
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="p-2 bg-white rounded-lg">
                                <QRCode value={selectedService.configLink} size={160} />
                            </div>
                            <Label>اسکن کنید</Label>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">پلن:</span>
                        <span className="font-medium">{getPlan(selectedService.planId)?.name}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">تاریخ خرید:</span>
                        <span className="font-medium">{new Date(selectedService.createdAt).toLocaleString('fa-IR')}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">تاریخ انقضا:</span>
                        <span className="font-medium">{new Date(selectedService.expiresAt).toLocaleString('fa-IR')}</span>
                    </div>
                    {isFetchingTraffic ? (
                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>در حال دریافت اطلاعات ترافیک...</span>
                        </div>
                    ) : trafficInfo ? (
                        <>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">وضعیت در پنل:</span>
                            <span className="font-medium">
                                {trafficInfo.enable 
                                    ? <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                                    : <Badge variant="destructive">غیرفعال</Badge>
                                }
                            </span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">حجم مصرفی:</span>
                            <span className="font-medium" dir="ltr">{formatBytes(trafficInfo.up + trafficInfo.down)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">حجم باقی‌مانده:</span>
                            <span className="font-medium font-bold text-primary" dir="ltr">{formatBytes(trafficInfo.total - (trafficInfo.up + trafficInfo.down))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">حجم کل:</span>
                            <span className="font-medium" dir="ltr">{formatBytes(trafficInfo.total)}</span>
                        </div>
                        </>
                    ) : (
                         <div className="flex justify-center items-center gap-2 text-muted-foreground">
                            <span>اطلاعات ترافیک در دسترس نیست.</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">شناسه سرویس:</span>
                        <span className="font-mono text-xs">{selectedService.clientEmail || '-'}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">مبلغ پرداخت شده:</span>
                        <span className="font-medium">{formatCurrency(selectedService.finalPrice || 0)} تومان</span>
                    </div>
                    <div className="space-y-2">
                        <Label>اطلاعات اتصال/لینک‌ها:</Label>
                        <div className="p-3 bg-muted rounded-md text-muted-foreground min-h-[100px] whitespace-pre-wrap break-all font-mono text-xs">
                            {selectedService.configLink || 'لینک یا اطلاعاتی برای نمایش وجود ندارد.'}
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleCopy(selectedService.configLink || '')} disabled={!selectedService.configLink}>
                            <Copy className="ml-2 h-4 w-4" />
                            کپی کردن لینک
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>تمدید سرویس</DialogTitle>
              {serviceToRenew && (
                <DialogDescription>
                  سرویس کاربر <span className="font-bold">{getAccount(serviceToRenew.userId)?.name}</span> را تمدید کنید.
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="renewal-plan-id">پلن تمدید</Label>
                <Select value={renewalState.planId} onValueChange={(value) => setRenewalState(p => ({...p, planId: value}))}>
                  <SelectTrigger id="renewal-plan-id">
                    <SelectValue placeholder="یک پلن برای تمدید انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRenewalPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({formatCurrency(
                             (getAccount(serviceToRenew?.userId || '')?.role === 'agent' && plan.agentPrice !== undefined) ? plan.agentPrice : plan.price
                         )} تومان)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">هزینه تمدید:</p>
                <p className="text-lg font-bold">{formatCurrency(renewalState.finalPrice)} تومان</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRenewService} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                تایید و تمدید
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>آیا کاملاً مطمئن هستید؟</AlertDialogTitle>
                <AlertDialogDescription>
                    این عملیات غیرقابل بازگشت است. این کار سرویس را از این لیست و همچنین کاربر را از پنل سرور (در صورت وجود) یا موجودی آماده حذف خواهد کرد.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setServiceToDelete(null)}>انصراف</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteService} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    بله، حذف کن
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
