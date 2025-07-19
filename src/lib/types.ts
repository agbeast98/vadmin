

export type Role = 'superadmin' | 'admin' | 'agent' | 'user' | 'supporter';

export type AccountStatus = 'active' | 'inactive';

// Represents an isolated administrative environment. Each admin has one tenant.
export type Tenant = {
  id: string;
  name: string;
  path: string; // e.g., "my-shop", used in URL
  createdAt: string;
};

export type Permissions = {
  telegramBot: boolean;
  panelAlireza: boolean;
  panelSanaei: boolean;
  panelMarzban: boolean;
  panelShahan: boolean;
  panelAgents: boolean;
  premadeStock: boolean;
};

export type SupporterType = 'financial' | 'ticket' | 'technical' | 'full';

export type SupporterPermissions = {
  canViewUsers: boolean;
  canViewServices: boolean;
  canViewPackages: boolean;
  canViewTickets: boolean;
  canViewCoupons: boolean;
  canViewTopUpRequests: boolean;
  panelAgents: boolean;
};

export interface Account {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  lastActive?: string; // ISO string for the last activity timestamp
  code?: string;
  walletBalance?: number;
  salesCount?: number;
  permissions?: Permissions;
  allowNegativeBalance?: boolean;
  negativeBalanceLimit?: number;
  // Supporter-specific fields
  supporterType?: SupporterType;
  supporterPermissions?: SupporterPermissions;
  // Iron-session user property
  user?: Account;
}

export const supportedPanelTypes = ['alireza-xui', 'sanaei', 'marzban', 'shahan'] as const;
export type PanelType = (typeof supportedPanelTypes)[number];

export interface Server {
  id: string;
  name:string;
  panelType: PanelType | '';
  status: 'online' | 'offline';
  onlineUsers: number;
  panelUrl?: string;
  panelUser?: string;
  panelPass?: string;
  publicDomain?: string;
  publicPort?: number;
}

export type Category = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

export type Plan = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  agentPrice?: number;
  durationDays: number;
  postPurchaseInfo: string;
  status: 'active' | 'inactive';
  provisionType: 'auto' | 'pre-made';
  
  // Auto-provision fields
  serverId?: string;
  protocol?: 'vless' | 'vmess' | 'trojan';
  volumeGB?: number; // Gigabytes
  inboundId?: string; 
  remark?: string; // Remark template e.g., {name}-{id}
  connectionDomain?: string;
  connectionPort?: string;

  // Pre-made provision fields
  preMadeItemGroupId?: string;
};

export type Service = {
  id: string;
  userId: string;
  planId: string;
  categoryId: string;
  createdAt: string;
  expiresAt: string;
  appliedCouponCode?: string;
  finalPrice?: number;
  // Provisioning data
  serverId?: string;
  clientEmail?: string; 
  clientUUID?: string;
  configLink?: string; 
  // Pre-made provision fields
  preMadeItemId?: string;
  // Traffic data (updated on demand)
  totalTraffic?: number; // in bytes
  usedTraffic?: number; // in bytes
};

export interface ClientSettings {
    uuid: string;
    email: string;
    id: string; // Inbound ID
    totalGB?: number;
    expiryTime?: number;
    flow?: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketDepartment = 'TECHNICAL' | 'FINANCIAL' | 'SALES' | 'GENERAL';

export type TicketReply = {
  id: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  subject: string;
  department: TicketDepartment;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  relatedServiceId?: string;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
};

export type Expense = {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string; // ISO string for date
    description?: string;
}

export type BankAccount = {
  id: string;
  cardHolder: string;
  cardNumber: string;
}

export type FinancialSettings = {
  accounts: BankAccount[];
};

export type Coupon = {
  id: string;
  code: string;
  type: 'percentage' | 'amount';
  value: number;
  usageLimit: number; // Total number of times this coupon can be used
  expiryDate: string | null;
  status: 'active' | 'inactive';
};

export type CouponUsage = {
    id: string;
    couponId: string;
    userId: string;
    serviceId: string;
    usedAt: string;
};

export type InvoiceStatus = 'paid' | 'pending' | 'cancelled';

export type Invoice = {
  id: string; 
  serviceId: string;
  userId: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: string; 
};

export type License = {
  id: string;
  name: string;
  licenseKey: string;
  userId: string;
  price: number;
  soldAt: string;
};

export type PreMadeItemGroup = {
  id: string;
  name: string;
};

export type PreMadeItem = {
  id: string;
  groupId: string;
  content: string;
  status: 'available' | 'sold';
  userId?: string;
  soldAt?: string;
};

export type TelegramBotSettings = {
  token: string;
  isEnabled: boolean;
  welcomeMessage: string;
  startMenu: string;
  guideMessage: string;
};

export type PanelSettings = {
  panelName: string;
  isSignupEnabled: boolean;
  licenseExpiresAt?: string;
  totalServiceLimit?: number;
  paymentMethods?: {
    wallet: boolean;
    cash: boolean;
    zarinpal: boolean;
    zibal: boolean;
  }
};

export type AboutSettings = {
  aboutText: string;
}

export type TrafficInfo = {
    up: number;
    down: number;
    total: number;
    expiryTime: number;
    enable: boolean;
}

export type TopUpRequestStatus = 'pending' | 'approved' | 'rejected';

export type TopUpRequest = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  receiptDetails: string;
  status: TopUpRequestStatus;
  createdAt: string;
  updatedAt: string;
  displayedAccount?: BankAccount;
};
