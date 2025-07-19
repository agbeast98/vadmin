
'use server';

import type { Server } from '../types';

interface ShahanStatusResponse {
    status: boolean;
    // other fields might exist
}

interface ShahanUser {
    id: number;
    username: string;
    password?: string;
    email?: string;
    mobile?: string;
    multiuser: number;
    startdate: string;
    enddate: string;
    finishdate?: any;
    customer_user: string;
    status: string;
    traffic: number;
    referral: string;
    desc: string;
    online: number; // This is what we need for online user count
}

interface ShahanUsersResponse {
    users: ShahanUser[];
    // other fields might exist
}

/**
 * Tests the connection to a Shahan panel using its API token.
 * @param server The server object with connection details. panelPass is used for the API token.
 * @returns A promise that resolves to an object indicating connection status.
 */
export async function testShahanConnection(server: Server): Promise<{ success: boolean; error?: string; onlineUsers?: number }> {
    // For Shahan panel, panelPass is the API Token (x-access-token)
    if (!server.panelUrl || !server.panelPass) {
        return { success: false, error: "اطلاعات کامل سرور (آدرس پنل و کلید API در فیلد رمز عبور) وارد نشده است." };
    }

    try {
        let baseUrlString = server.panelUrl;
        if (!/^https?:\/\//i.test(baseUrlString)) {
            baseUrlString = `http://${baseUrlString}`;
        }
        
        const baseUrl = new URL(baseUrlString);
        
        // According to the source code, the root endpoint is a good status check
        const statusUrl = new URL('/', baseUrl).href; 
        const usersUrl = new URL('/users', baseUrl).href;
        const apiToken = server.panelPass;

        const headers = {
            'Accept': 'application/json',
            'x-access-token': apiToken,
        };

        // --- Step 1: Test connection with a simple status check ---
        const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers,
            cache: 'no-store',
        });

        if (!statusResponse.ok) {
            return { success: false, error: `سرور با کد وضعیت ${statusResponse.status} پاسخ داد. از درستی آدرس و کلید API اطمینان حاصل کنید.` };
        }

        const statusData: ShahanStatusResponse = await statusResponse.json();
        if (!statusData.status) {
            return { success: false, error: "کلید API معتبر نیست یا سرور پاسخی ناموفق برگرداند." };
        }

        // --- Step 2: Fetch users to count online clients ---
        const usersResponse = await fetch(usersUrl, {
            method: 'GET',
            headers,
            cache: 'no-store',
        });

        if (!usersResponse.ok) {
            return { success: false, error: `اتصال به سرور موفق بود اما دریافت لیست کاربران با خطا مواجه شد (کد: ${usersResponse.status}).` };
        }

        const usersData: ShahanUsersResponse = await usersResponse.json();
        const onlineCount = usersData.users?.filter(user => user.online === 1).length ?? 0;
        
        return { success: true, onlineUsers: onlineCount };

    } catch (error: any) {
        if (error instanceof TypeError && error.message.includes('Invalid URL')) {
            return { success: false, error: `آدرس پنل نامعتبر است. آدرس وارد شده: "${server.panelUrl}"` };
        }
        if (error.cause?.code === 'ENOTFOUND') {
            return { success: false, error: 'هاست پیدا نشد. آدرس دامنه یا ساب‌دامین را بررسی کنید.' };
        }
        if (error.cause?.code === 'ECONNREFUSED') {
            return { success: false, error: 'اتصال رد شد. از روشن بودن سرور و در دسترس بودن پورت اطمینان حاصل کنید.' };
        }
        return { success: false, error: `یک خطای شبکه ناشناخته رخ داد: ${error.message}` };
    }
}
