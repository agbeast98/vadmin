
'use server';

import type { Server, Service, Plan, TrafficInfo } from './types';
import { testAlirezaConnection, renewAlirezaUser, getAlirezaClientTraffic, deleteAlirezaUser } from './panels/alireza-xui';
import { testSanaeiConnection, createSanaeiUser, getSanaeiClientTraffic, renewSanaeiUser } from './panels/sanaei';
import { testMarzbanConnection } from './panels/marzban';
import { testShahanConnection } from './panels/shahan';
import { addDays, add } from 'date-fns';
import { PLANS_STORAGE_KEY } from './constants';

/**
 * A Server Action to test the connection to a given server panel.
 * It acts as a router, calling the appropriate panel-specific test function.
 * This should be called from the client-side.
 * @param server The server object containing connection details.
 * @returns A promise that resolves to an object with a success boolean and an optional error message.
 */
export async function testServerConnection(server: Server): Promise<{ success: boolean; error?: string; onlineUsers?: number; }> {
    switch (server.panelType) {
        case 'alireza-xui':
            return await testAlirezaConnection(server);
        case 'sanaei':
            return await testSanaeiConnection(server);
        case 'marzban':
             return await testMarzbanConnection(server);
        case 'shahan':
             return await testShahanConnection(server);
        default:
            return { success: false, error: 'نوع پنل انتخاب شده پشتیبانی نمی‌شود.' };
    }
}


/**
 * A Server Action to renew a service on the corresponding panel.
 * It resets the traffic and expiration date based on the new plan.
 * @param service The service to renew.
 * @param renewalPlan The new plan to apply.
 * @param server The server where the service is hosted.
 * @returns A promise that resolves to an object indicating success and optional logs.
 */
export async function renewServiceOnPanel(
    service: Service,
    renewalPlan: Plan,
    server: Server
): Promise<{ success: boolean; error?: string; logs?: string[] }> {
    const logs: string[] = [];
    if (!service.clientEmail || !renewalPlan.inboundId) {
        return { success: false, error: 'سرویس فاقد شناسه کاربری یا شناسه اینباند لازم برای تمدید است.' };
    }

    const newExpiryDate = addDays(new Date(service.expiresAt), renewalPlan.durationDays || 30);
    const newTotalGB = (renewalPlan.volumeGB || 0) * 1024 * 1024 * 1024; // Convert GB to Bytes

    const clientUpdateData = {
        email: service.clientEmail,
        inboundId: renewalPlan.inboundId,
        expiryTime: newExpiryDate.getTime(),
        totalGB: newTotalGB,
    };
    
    logs.push(`INFO: Preparing to renew user ${clientUpdateData.email} on server ${server.name}.`);
    logs.push(`INFO: New Expiry: ${newExpiryDate.toISOString()}, New Volume: ${renewalPlan.volumeGB} GB.`);

    switch (server.panelType) {
        case 'alireza-xui':
             return await renewAlirezaUser(server, clientUpdateData);
        case 'sanaei':
            return await renewSanaeiUser(server, clientUpdateData);
        default:
             logs.push(`ERROR: Panel type ${server.panelType} does not support automatic renewal.`);
            return { success: false, error: `تمدید خودکار برای این نوع پنل (${server.panelType}) پیاده‌سازی نشده است.`, logs };
    }
}


/**
 * A Server Action to get the traffic usage for a specific client from the panel.
 * @param service The service object for which to fetch traffic.
 * @param server The server where the service is hosted.
 * @returns A promise that resolves to an object with traffic information.
 */
export async function getClientTraffic(
    service: Service,
    server: Server
): Promise<{ success: boolean; error?: string; data?: TrafficInfo; logs?: string[] }> {
    if (!service.clientEmail) {
        return { success: false, error: 'سرویس فاقد شناسه کاربری لازم برای دریافت ترافیک است.' };
    }

    switch (server.panelType) {
        case 'alireza-xui':
            return await getAlirezaClientTraffic(server, service.clientEmail);
        case 'sanaei':
             return await getSanaeiClientTraffic(server, service.clientEmail);
        default:
            return { success: false, error: `دریافت اطلاعات ترافیک برای این نوع پنل (${server.panelType}) پیاده‌سازی نشده است.` };
    }
}


/**
 * A Server Action to delete a service from the corresponding panel.
 * @param service The service to delete.
 * @param server The server where the service is hosted.
 * @param allPlans All plans, to find the correct inboundId.
 * @returns A promise that resolves to an object indicating success and optional logs.
 */
export async function deleteServiceFromPanel(
    service: Service,
    server: Server,
    allPlans: Plan[]
): Promise<{ success: boolean; error?: string; logs?: string[] }> {
     if (!service.clientEmail || !service.planId) {
        return { success: false, error: 'سرویس فاقد شناسه کاربری یا شناسه پلن لازم برای حذف است.' };
    }
    
    const plan = allPlans.find(p => p.id === service.planId);

    if(!plan || !plan.inboundId) {
        return { success: false, error: 'پلن سرویس یا شناسه اینباند آن برای حذف یافت نشد.' };
    }

    const clientDeleteData = {
        email: service.clientEmail,
        inboundId: plan.inboundId,
    };
    
    switch (server.panelType) {
        case 'alireza-xui':
             return await deleteAlirezaUser(server, clientDeleteData);
        // Add cases for other panels here
        default:
            return { success: false, error: `حذف خودکار برای این نوع پنل (${server.panelType}) پیاده‌سازی نشده است.` };
    }
}
