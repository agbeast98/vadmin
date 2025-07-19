
'use client';

import * as React from 'react';
import { AuthContext } from '@/hooks/auth-provider';
import type { Account, PanelSettings, FinancialSettings } from '@/lib/types';


export type UseAuthReturn = {
  user: Account | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  accounts: Account[]; 
  setAccounts: (value: React.SetStateAction<Account[]>) => void;
  panelSettings: PanelSettings;
  setPanelSettings: (value: React.SetStateAction<PanelSettings>) => void;
  financialSettings: FinancialSettings;
  setFinancialSettings: (value: React.SetStateAction<FinancialSettings>) => void;
  handleRedirect: () => void; 
};

export function useAuth(): UseAuthReturn {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
      ...context,
      accounts: context.accounts || [],
      panelSettings: context.panelSettings || { panelName: 'V-Admin Panel', isSignupEnabled: true },
      financialSettings: context.financialSettings || { accounts: [] },
  };
}
