
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { IronSession, getIronSession } from 'iron-session';
import type { Account, PanelSettings, FinancialSettings, TopUpRequest } from './types';
import * as C from './constants';

// --- Iron Session Setup ---
const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long',
  cookieName: 'vpn-panel-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(readOnly = false): Promise<IronSession<Account | null>> {
    const session = await getIronSession<Account | null>(cookies(), { ...sessionOptions, password: sessionOptions.password! });
    
    // Hack to workaround read-only bug in iron-session
    if(readOnly && !session.user) {
        return { user: null, save: async () => {}, destroy: async () => {} } as IronSession<Account | null>;
    }
    return session;
}

export async function setSession(user: Account): Promise<void> {
    const session = await getSession();
    session.user = user;
    await session.save();
}

export async function clearSession(): Promise<void> {
    const session = await getSession();
    session.destroy();
}


// --- File-based Database Service ---

const dataDir = path.join(process.cwd(), C.DATA_DIR);

async function readData<T>(filename: string, defaultValue: T): Promise<T> {
    const filePath = path.join(dataDir, filename);
    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent) as T;
    } catch (error) {
        // If file doesn't exist, create it with default value
        await writeData(filename, defaultValue);
        return defaultValue;
    }
}

async function writeData<T>(filename: string, data: T): Promise<{success: boolean, error?: string}> {
    const filePath = path.join(dataDir, filename);
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error: any) {
        console.error(`Error writing to ${filename}:`, error);
        return { success: false, error: `Failed to write data: ${error.message}` };
    }
}

// --- Public Data Access Functions ---

export async function getAccounts(): Promise<Account[]> {
    return await readData<Account[]>(C.ACCOUNTS_STORAGE_KEY, []);
}

export async function addAccount(account: Account): Promise<{success: boolean, error?: string}> {
    const accounts = await getAccounts();
    accounts.push(account);
    return await writeData(C.ACCOUNTS_STORAGE_KEY, accounts);
}

export async function updateAccount(updatedAccount: Account): Promise<{success: boolean, error?: string}> {
    const accounts = await getAccounts();
    const index = accounts.findIndex(acc => acc.id === updatedAccount.id);
    if (index === -1) return { success: false, error: "Account not found" };
    accounts[index] = updatedAccount;
    return await writeData(C.ACCOUNTS_STORAGE_KEY, accounts);
}

export async function deleteAccount(accountId: string): Promise<{success: boolean, error?: string}> {
    const accounts = await getAccounts();
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    return await writeData(C.ACCOUNTS_STORAGE_KEY, updatedAccounts);
}

export async function getPanelSettings(): Promise<PanelSettings> {
    return await readData<PanelSettings>(C.PANEL_SETTINGS_STORAGE_KEY, { panelName: "V-Admin Panel", isSignupEnabled: true });
}

export async function setPanelSettings(settings: PanelSettings): Promise<{success: boolean, error?: string}> {
    return await writeData(C.PANEL_SETTINGS_STORAGE_KEY, settings);
}

export async function getFinancialSettings(): Promise<FinancialSettings> {
    return await readData<FinancialSettings>(C.FINANCIAL_SETTINGS_STORAGE_KEY, { accounts: [] });
}

export async function setFinancialSettings(settings: FinancialSettings): Promise<{success: boolean, error?: string}> {
    return await writeData(C.FINANCIAL_SETTINGS_STORAGE_KEY, settings);
}

export async function addTopUpRequest(request: TopUpRequest): Promise<{success: boolean, error?: string}> {
    const requests = await readData<TopUpRequest[]>(C.TOP_UP_REQUESTS_STORAGE_KEY, []);
    requests.unshift(request); // Add to the beginning of the list
    return await writeData(C.TOP_UP_REQUESTS_STORAGE_KEY, requests);
}

// --- Initial Data Loader for Client ---
export async function getInitialData() {
    const [accounts, panelSettings, financialSettings] = await Promise.all([
        getAccounts(),
        getPanelSettings(),
        getFinancialSettings(),
    ]);
    return { accounts, panelSettings, financialSettings };
}
