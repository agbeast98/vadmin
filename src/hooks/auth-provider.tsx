
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Account, PanelSettings, FinancialSettings } from '@/lib/types';
import { getInitialData, getSession, setSession as saveSession, clearSession } from '@/lib/data-service';
import { ClientOnly } from '@/components/client-only';
import { Toaster } from '@/components/ui/toaster';

type AuthContextValue = {
  user: Account | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  panelSettings: PanelSettings;
  setPanelSettings: React.Dispatch<React.SetStateAction<PanelSettings>>;
  financialSettings: FinancialSettings;
  setFinancialSettings: React.Dispatch<React.SetStateAction<FinancialSettings>>;
  handleRedirect: () => void;
};

const defaultPanelSettings: PanelSettings = {
    panelName: "V-Admin Panel",
    isSignupEnabled: true,
}

const defaultFinancialSettings: FinancialSettings = {
    accounts: [],
}

export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    
    const [user, setUser] = React.useState<Account | null>(null);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [panelSettings, setPanelSettings] = React.useState<PanelSettings>(defaultPanelSettings);
    const [financialSettings, setFinancialSettings] = React.useState<FinancialSettings>(defaultFinancialSettings);
    const [isLoading, setIsLoading] = React.useState(true);
    
    React.useEffect(() => {
        const initialize = async () => {
            try {
                const initialData = await getInitialData();
                setAccounts(initialData.accounts || []);
                setPanelSettings(initialData.panelSettings || defaultPanelSettings);
                setFinancialSettings(initialData.financialSettings || defaultFinancialSettings);
                
                const sessionUser = await getSession();
                
                if (sessionUser) {
                     const liveUser = (initialData.accounts || []).find(a => a.id === sessionUser.id);
                     if (liveUser?.status === 'active') {
                       setUser(liveUser);
                     } else {
                       setUser(null);
                       await clearSession();
                     }
                } else {
                    setUser(null);
                }
            } catch (e) {
                console.error('Failed to initialize auth provider:', e);
                setUser(null);
                setAccounts([]);
                setPanelSettings(defaultPanelSettings);
                setFinancialSettings(defaultFinancialSettings);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []);
    
    const logout = React.useCallback(async () => {
        await clearSession();
        setUser(null);
        router.push('/');
        router.refresh(); // Ensure server state is cleared
    }, [router]);
    
    const handleRedirect = React.useCallback(() => {
        if(isLoading) return;
        router.push('/khpanel');
    }, [isLoading, router]);


    const value: AuthContextValue = React.useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        accounts,
        setAccounts,
        panelSettings,
        setPanelSettings,
        financialSettings,
        setFinancialSettings,
        handleRedirect
    }), [user, isLoading, logout, accounts, panelSettings, financialSettings, handleRedirect]);

    return (
        <AuthContext.Provider value={value}>
            {children}
            <ClientOnly>
              <Toaster />
            </ClientOnly>
        </AuthContext.Provider>
    );
}
