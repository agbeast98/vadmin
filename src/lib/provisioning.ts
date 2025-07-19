
'use server';

import type { Service, Plan, Account, Server, PreMadeItem } from './types';
import { createAlirezaUser } from './panels/alireza-xui';
import { createSanaeiUser } from './panels/sanaei';
import { addDays } from 'date-fns';
import { PRE_MADE_ITEMS_STORAGE_KEY } from './constants';

type ProvisionResult = {
    success: boolean;
    error?: string;
    message?: string;
    serviceData?: Partial<Service>; // Data to be merged into the service object
    logs?: string[];
}

/**
 * Main service provisioning function.
 * Acts as a router to call the appropriate function based on the plan's provisionType.
 * @param service The base service object being created.
 * @param plan The plan associated with the service.
 * @param user The user account for whom the service is being created.
 * @param allServers All available server configurations from the client.
 * @param clientIdentifier An optional custom identifier for the client.
 * @returns A promise that resolves to a ProvisionResult object.
 */
export async function provisionService(
    service: Omit<Service, 'id'>, 
    plan: Plan, 
    user: Account,
    allServers: Server[],
    clientIdentifier?: string
): Promise<ProvisionResult> {
    
    if (plan.provisionType === 'auto') {
        return provisionAuto(service, plan, user, allServers, clientIdentifier);
    }
    
    // For 'pre-made', the client has already assigned the item and is sending the data.
    // We just trust the client and add the service data.
    if (plan.provisionType === 'pre-made') {
        return {
            success: true,
            message: 'سرویس از نوع موجودی آماده است.',
            serviceData: service, // The client sends the complete service object.
            logs: ['INFO: Pre-made service provisioning triggered. Logic handled on client.'],
        }
    }

    return { success: false, error: 'نوع تحویل سرویس نامشخص است.', logs: ['ERROR: Provision type is not specified in the plan.'] };
}

/**
 * Handles automatic service provisioning by creating a user on a server panel.
 */
async function provisionAuto(
    service: Omit<Service, 'id'>,
    plan: Plan, 
    user: Account,
    allServers: Server[],
    clientIdentifier?: string
): Promise<ProvisionResult> {
    const logs: string[] = ['INFO: Starting automatic provisioning.'];
    if (!plan.serverId) {
        logs.push('ERROR: No server ID is associated with the plan.');
        return { success: false, error: 'هیچ سروری برای این پلن انتخاب نشده است.', logs };
    }
    logs.push(`INFO: Plan requires server ID: ${plan.serverId}`);

    const targetServer = allServers.find(s => s.id === plan.serverId);
    if (!targetServer) {
        logs.push(`ERROR: Server with ID ${plan.serverId} not found in the provided list of servers.`);
        return { success: false, error: `پیکربندی سرور با شناسه ${plan.serverId} یافت نشد.`, logs };
    }
    logs.push(`INFO: Target server found: ${targetServer.name}. Panel type: ${targetServer.panelType}`);
    
    const serviceId = `service-${Date.now()}`;
    
    let finalClientIdentifier: string;
    if (clientIdentifier && clientIdentifier.trim() !== '') {
        finalClientIdentifier = clientIdentifier.trim();
        logs.push(`INFO: Using custom client identifier: ${finalClientIdentifier}`);
    } else {
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        finalClientIdentifier = `${user.email}-${randomNumber}`;
        logs.push(`INFO: No custom identifier provided. Generated identifier: ${finalClientIdentifier}`);
    }

    const clientUUID = crypto.randomUUID();
    const expiryDate = addDays(new Date(), plan.durationDays || 30);
    const totalGB = (plan.volumeGB || 0) * 1024 * 1024 * 1024; // Convert GB to Bytes
    
    const clientSettings = {
        uuid: clientUUID,
        email: finalClientIdentifier,
        totalGB: totalGB,
        expiryTime: expiryDate.getTime(), 
        id: plan.inboundId || '',
        flow: '' // Flow is part of VLESS, handled in link generation
    };
    logs.push(`INFO: Generated client settings: ${JSON.stringify({ ...clientSettings, uuid: '...' })}`);

    let provisionResult;
    switch (targetServer.panelType) {
        case 'alireza-xui':
            logs.push('INFO: Routing to alireza-xui panel provisioner.');
            provisionResult = await createAlirezaUser(targetServer, plan, clientSettings);
            break;
        case 'sanaei':
            logs.push('INFO: Routing to sanaei panel provisioner.');
            provisionResult = await createSanaeiUser(targetServer, plan, clientSettings);
            break;
        // Cases for 'marzban', 'shahan' would go here in the future
        default:
             logs.push(`ERROR: Panel type '${targetServer.panelType}' is not supported for auto-provisioning.`);
            return { success: false, error: `پنل از نوع '${targetServer.panelType}' برای ساخت خودکار پشتیبانی نمی‌شود.`, logs };
    }
    
    const finalLogs = [...logs, ...(provisionResult.logs || [])];

    if (!provisionResult.success) {
        return { success: false, error: `خطا در ساخت کاربر در پنل: ${provisionResult.error}`, logs: finalLogs };
    }
    
    const newService: Service = {
        id: serviceId,
        ...service,
        serverId: plan.serverId,
        clientEmail: finalClientIdentifier,
        clientUUID: clientUUID,
        configLink: provisionResult.configLink,
    };
    logs.push(`INFO: Provisioning successful. Returning service data.`);

    return {
        success: true,
        message: `سرویس با موفقیت بر روی سرور '${targetServer.name}' ایجاد شد.`,
        serviceData: newService,
        logs: finalLogs
    };
}
