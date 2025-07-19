
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Package, Folder, FileText, ChevronDown, Ticket, Users, UserCog, Server, Layers3, ScrollText, UserCheck, CreditCard, Receipt, Banknote, CandlestickChart, Wallet, LifeBuoy, Percent, PackagePlus, Bot, Info, UserCircle, ShieldAlert, KeyRound, CalendarClock, HandCoins, PlusCircle, History } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Permissions, SupporterPermissions } from '@/lib/types';

type NavItem = {
  href?: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
  permissionKey?: keyof Permissions;
  supporterPermissionKey?: keyof SupporterPermissions;
  subItems?: NavItem[];
};


const allNavItems: NavItem[] = [
  // Admin & other roles routes
  { href: '/khpanel/dashboard', icon: LayoutDashboard, label: 'داشبورد', roles: ['superadmin', 'admin', 'agent', 'user', 'supporter'] },
  { href: '/khpanel/services', icon: Layers3, label: 'سرویس‌ها', roles: ['superadmin', 'admin', 'agent', 'user', 'supporter'], supporterPermissionKey: 'canViewServices' },
  {
    label: 'کیف پول',
    icon: Wallet,
    roles: ['agent', 'user'],
    subItems: [
        { href: '/khpanel/wallet', label: 'افزایش موجودی', icon: PlusCircle, roles: ['agent', 'user'] },
        { href: '/khpanel/wallet/history', label: 'تاریخچه درخواست‌ها', icon: History, roles: ['agent', 'user'] },
    ]
  },
  {
    label: 'بسته‌ها',
    icon: Package,
    roles: ['admin', 'supporter'],
    supporterPermissionKey: 'canViewPackages',
    subItems: [
      { href: '/khpanel/packages/plans', label: 'پلن‌ها', roles: ['admin', 'supporter'], supporterPermissionKey: 'canViewPackages' },
      { href: '/khpanel/packages/categories', label: 'دسته‌بندی‌ها', roles: ['admin', 'supporter'], supporterPermissionKey: 'canViewPackages' },
      { href: '/khpanel/packages/pre-made', label: 'موجودی آماده', roles: ['admin', 'supporter'], permissionKey: 'premadeStock', supporterPermissionKey: 'canViewPackages' },
    ],
  },
  { href: '/khpanel/servers', icon: Server, label: 'سرورها', roles: ['admin'], permissionKey: 'panelAlireza' }, // Example for a specific panel
  {
    label: 'کاربران',
    icon: Users,
    roles: ['superadmin', 'admin', 'supporter'],
    supporterPermissionKey: 'canViewUsers',
    subItems: [
        { href: '/khpanel/admins', label: 'مدیریت ادمین‌ها', icon: ShieldAlert, roles: ['superadmin'] },
        { href: '/khpanel/users', label: 'کاربران و نمایندگان', icon: Users, roles: ['admin', 'supporter'], supporterPermissionKey: 'canViewUsers' },
        { href: '/khpanel/supporters', label: 'پشتیبان‌ها', icon: LifeBuoy, roles: ['admin'] },
    ]
  },
  { href: '/khpanel/tickets', icon: Ticket, label: 'تیکت‌های پشتیبانی', roles: ['superadmin', 'admin', 'agent', 'user', 'supporter'], supporterPermissionKey: 'canViewTickets' },
  { 
    label: 'بخش مالی',
    icon: CreditCard,
    roles: ['admin', 'supporter'],
    subItems: [
        { href: '/khpanel/financial/overview', label: 'بررسی کلی', roles: ['admin'] },
        { href: '/khpanel/financial/top-up-requests', label: 'درخواست‌های شارژ', icon: HandCoins, roles: ['admin', 'supporter'], supporterPermissionKey: 'canViewTopUpRequests' },
        { href: '/khpanel/financial/coupons', label: 'کدهای تخفیف', icon: Percent, roles: ['admin', 'supporter'], supporterPermissionKey: 'canViewCoupons' },
        { href: '/khpanel/financial/expenses', label: 'هزینه‌ها', icon: Wallet, roles: ['admin'] },
        { href: '/khpanel/financial/invoices', label: 'فاکتورها', icon: Receipt, roles: ['admin'] },
        { href: '/khpanel/financial/payments', label: 'پرداختی ها', icon: Banknote, roles: ['admin'] },
        { href: '/khpanel/financial/settings', label: 'تنظیمات مالی', icon: Settings, roles: ['admin'] },
    ]
  },
  { href: '/khpanel/logs', icon: ScrollText, label: 'لاگ‌ها', roles: ['superadmin', 'admin'] },
  { 
    label: 'تنظیمات',
    icon: Settings, 
    roles: ['superadmin', 'admin', 'agent', 'user', 'supporter'],
    subItems: [
        { href: '/khpanel/settings/permissions', label: 'دسترسی‌ها', icon: KeyRound, roles: ['superadmin'] },
        { href: '/khpanel/settings/licenses', label: 'مدیریت لایسنس‌ها', icon: CalendarClock, roles: ['superadmin'] },
        { href: '/khpanel/settings', label: 'تنظیمات پنل', icon: UserCircle, roles: ['superadmin', 'admin', 'agent', 'user', 'supporter'] },
        { href: '/khpanel/settings/telegram-bot', label: 'ربات تلگرام', icon: Bot, roles: ['admin'], permissionKey: 'telegramBot' },
        { href: '/khpanel/settings/about', label: 'درباره پنل', icon: Info, roles: ['admin'] },
    ]
  },
];


const constructHref = (path: string) => {
    return path;
}

const getCollapsibleKey = (label: string) => {
    return label.toLowerCase().replace(/بخش |‌ها| های/g, '').replace(/\s+/g, '-');
}

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = React.useMemo(() => {
    if (!user) return [];

    const currentRole = user.role;
    const permissions = user.permissions || {};
    const supporterPermissions = user.supporterPermissions || {};

    const filterItems = (items: NavItem[]): NavItem[] => {
      return items
        .map((item) => {
          // 1. Role Check: Does the user's role have access?
          if (!item.roles.includes(currentRole)) return null;

          // 2. Admin Permission Check
          if (currentRole === 'admin' && item.permissionKey) {
            if (!permissions[item.permissionKey]) {
              return null;
            }
          }

          // 3. Supporter Permission Check
          if (currentRole === 'supporter' && item.supporterPermissionKey) {
              if (!supporterPermissions[item.supporterPermissionKey]) {
                  return null;
              }
          }

          // 4. Sub-item Filtering
          if (item.subItems) {
            const accessibleSubItems = filterItems(item.subItems);
            if (accessibleSubItems.length === 0) return null;
            return { ...item, subItems: accessibleSubItems };
          }
          
          return item;
        })
        .filter(Boolean) as NavItem[];
    };

    return filterItems(allNavItems);
  }, [user]);

  const initialOpenStates = React.useMemo(() => {
    const states: Record<string, boolean> = {};
    if (!pathname) return states;
    navItems.forEach(item => {
        if (item && item.subItems) {
            const key = getCollapsibleKey(item.label);
            states[key] = item.subItems.some(sub => sub.href && pathname.startsWith(constructHref(sub.href)));
        }
    });
    return states;
  }, [pathname, navItems]);


  const [openStates, setOpenStates] = React.useState(initialOpenStates);

  React.useEffect(() => {
    setOpenStates(initialOpenStates);
  }, [initialOpenStates]);


  const toggleCollapsible = (key: string) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (!user) {
    return null; // Or a loading skeleton
  }

  return (
    <SidebarMenu className="px-2">
      {navItems.map((item, index) =>
        item && item.subItems ? (
          <Collapsible 
            open={openStates[getCollapsibleKey(item.label)]} 
            onOpenChange={() => toggleCollapsible(getCollapsibleKey(item.label))} 
            key={index}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className={cn('w-full justify-between')}
                  isActive={item.subItems.some(sub => sub.href && pathname.startsWith(constructHref(sub.href)))}
                  tooltip={item.label}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.subItems.map((subItem) => (
                  subItem.href && (
                    <SidebarMenuSubItem key={subItem.href}>
                      <SidebarMenuSubButton asChild isActive={pathname === constructHref(subItem.href)}>
                        <Link href={constructHref(subItem.href)}>
                          <div className="flex items-center gap-2">
                              {subItem.icon && <subItem.icon className="h-4 w-4" />}
                              <span>{subItem.label}</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          item && item.href && (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === constructHref(item.href)} tooltip={item.label}>
                  <Link href={constructHref(item.href)}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )
        )
      )}
    </SidebarMenu>
  );
}
