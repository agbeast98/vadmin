
'use server';

import type { Server, ClientSettings, Plan, TrafficInfo } from '../types';

interface AlirezaLoginResponse {
    success: boolean;
    msg: string;
    obj: any; 
}

interface AlirezaAPIResponse {
    success: boolean;
    msg: string;
    obj?: any;
}

// Represents the structure of a single client within an inbound
interface AlirezaClient {
    id: string;
    email: string;
    // other client properties...
}

// Represents the structure of an inbound
interface AlirezaInbound {
    id: number;
    remark: string;
    protocol: 'vless' | 'vmess' | 'trojan';
    port: number;
    settings: string; // This is a JSON string
    streamSettings: string; // This is a JSON string
    listen: string;
    // other inbound properties...
}


async function getLoginCookie(server: Server): Promise<{ success: boolean; cookie?: string; error?: string; logs: string[] }> {
    const logs: string[] = [];
    logs.push(`INFO: Attempting to get login cookie for server: ${server.name} (${server.panelUrl})`);

    if (!server.panelUrl || !server.panelUser || !server.panelPass) {
        const errorMsg = "ERROR: Server connection details (URL, username, password) are incomplete.";
        logs.push(errorMsg);
        return { success: false, error: "اطلاعات کامل سرور (آدرس، نام کاربری، رمز عبور) وارد نشده است.", logs };
    }

    try {
        let baseUrlString = server.panelUrl;
        if (!/^https?:\/\//i.test(baseUrlString)) {
            baseUrlString = `http://${baseUrlString}`;
        }
        const baseUrl = new URL(baseUrlString);
        const loginUrl = new URL('login', baseUrl).href;
        logs.push(`INFO: Attempting to login to URL: ${loginUrl}`);
        
        const loginBody = new URLSearchParams();
        loginBody.append('username', server.panelUser);
        loginBody.append('password', server.panelPass);

        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: loginBody.toString(),
            cache: 'no-store',
        });
        
        if(!loginResponse.ok) {
            const errorMsg = `ERROR: Login request failed with status: ${loginResponse.status} ${loginResponse.statusText}`;
            logs.push(errorMsg);
            return { success: false, error: `درخواست لاگین با خطا مواجه شد. وضعیت: ${loginResponse.status}`, logs };
        }

        const loginText = await loginResponse.text();
        let loginData: AlirezaLoginResponse;
        try {
            loginData = JSON.parse(loginText);
        } catch (e) {
            const errorMsg = `ERROR: Failed to parse JSON response from server. Response: ${loginText.substring(0, 150)}`;
            logs.push(errorMsg);
            return { success: false, error: `پاسخ دریافتی از سرور معتبر نبود.`, logs };
        }

        if (!loginData.success) {
            const errorMsg = `ERROR: Login failed. API message: ${loginData.msg}`;
            logs.push(errorMsg);
            return { success: false, error: loginData.msg || "نام کاربری یا رمز عبور اشتباه است.", logs };
        }
        
        const cookie = loginResponse.headers.get('Set-Cookie');
        if (!cookie) {
            const errorMsg = "ERROR: Login successful but no session cookie received.";
            logs.push(errorMsg);
            return { success: false, error: "کوکی نشست پس از لاگین دریافت نشد.", logs };
        }

        logs.push("INFO: Login successful, cookie obtained.");
        return { success: true, cookie, logs };

    } catch (error: any) {
         if (error.cause?.code === 'ENOTFOUND') {
            const errorMsg = `ERROR: Host not found: ${server.panelUrl}`;
            logs.push(errorMsg);
            return { success: false, error: `هاست پیدا نشد: ${server.panelUrl}`, logs };
        }
         if (error.cause?.code === 'ECONNREFUSED') {
            const errorMsg = `ERROR: Connection refused for: ${server.panelUrl}`;
            logs.push(errorMsg);
            return { success: false, error: `اتصال به سرور رد شد: ${server.panelUrl}`, logs };
        }
        const errorMsg = `ERROR: An unknown network error occurred: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای شبکه ناشناخته رخ داد: ${error.message}`, logs };
    }
}


export async function testAlirezaConnection(server: Server): Promise<{ success: boolean; error?: string; onlineUsers?: number }> {
    const { success, error, cookie, logs } = await getLoginCookie(server);
    if (!success) {
        return { success: false, error };
    }

    try {
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        const onlineUrl = new URL('xui/API/inbounds/onlines', baseUrl).href;
        
        const onlineResponse = await fetch(onlineUrl, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Cookie': cookie! },
            cache: 'no-store',
        });
        
        if (!onlineResponse.ok) {
             return { success: false, error: `خطا در دریافت کاربران آنلاین: ${onlineResponse.status} ${onlineResponse.statusText}` };
        }

        const onlineData: AlirezaAPIResponse = await onlineResponse.json();

        if (onlineData.success) {
            const onlineCount = onlineData.obj ? Object.keys(onlineData.obj).length : 0;
            return { success: true, onlineUsers: onlineCount };
        } else {
            return { success: false, error: `خطا در API کاربران آنلاین: ${onlineData.msg}` };
        }

    } catch (error: any) {
        return { success: false, error: `یک خطای ناشناخته در حین تست اتصال رخ داد: ${error.message}` };
    }
}


export async function createAlirezaUser(server: Server, plan: Plan, settings: ClientSettings): Promise<{ success: boolean; error?: string, configLink?: string, logs: string[] }> {
    const loginResult = await getLoginCookie(server);
    let logs = loginResult.logs;
    if (!loginResult.success) {
        return { success: false, error: loginResult.error, logs };
    }
    
    try {
        logs.push(`INFO: Attempting to create user ${settings.email} on inbound ${settings.id}`);
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        const addClientUrl = new URL('xui/API/inbounds/addClient/', baseUrl).href;
        
        const clientSettingsObject = {
            clients: [{
                id: settings.uuid,
                email: settings.email,
                totalGB: settings.totalGB,
                expiryTime: settings.expiryTime,
                enable: true,
                flow: '', // Flow is part of VLESS, not a general client setting here
                limitIp: 0,
                tgId: "",
                subId: ""
            }]
        };

        const bodyToSend = {
            id: parseInt(settings.id, 10),
            settings: JSON.stringify(clientSettingsObject)
        };
        
        logs.push(`INFO: Add client request body: ${JSON.stringify(bodyToSend)}`);

        const response = await fetch(addClientUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': loginResult.cookie!
            },
            body: JSON.stringify(bodyToSend),
            cache: 'no-store'
        });

        const responseText = await response.text();
        logs.push(`INFO: Add client response: ${responseText}`);
        let data: AlirezaAPIResponse;
        try {
            data = JSON.parse(responseText);
        } catch(e) {
            const errorMsg = `ERROR: Failed to parse JSON response from addClient. Response: ${responseText}`;
            logs.push(errorMsg);
            return { success: false, error: `پاسخ دریافتی از سرور هنگام ساخت کاربر معتبر نبود.`, logs };
        }

        if (data.success) {
            logs.push("INFO: User created successfully. Generating config link based on plan details.");

            const { protocol } = plan;
            const connectionDomain = plan.connectionDomain || server.publicDomain || new URL(server.panelUrl!).hostname;
            const connectionPort = plan.connectionPort;
            const remark = plan.remark;
            
            if (!protocol || !connectionDomain || !connectionPort) {
                const errorMsg = 'WARN: User created, but plan or server is missing connection details (protocol, domain, port).';
                logs.push(errorMsg);
                return { success: true, configLink: 'کاربر ساخته شد، اما اطلاعات ساخت لینک در پلن یا سرور ناقص است.', logs };
            }

            let configLink = 'Error: Protocol not supported in panel integration';
            const remarkText = remark ? remark.replace('{email}', settings.email) : settings.email;

            if (protocol === 'vless') {
                 configLink = `vless://${settings.uuid}@${connectionDomain}:${connectionPort}?encryption=none&security=none&type=tcp&headerType=none#${encodeURIComponent(remarkText)}`;
            } else if (protocol === 'vmess') {
                const vmessConfig = {
                    v: "2", ps: remarkText, add: connectionDomain, port: connectionPort,
                    id: settings.uuid, aid: 0, net: "tcp", type: "none",
                    host: "", path: "", tls: "", sni: ""
                };
                configLink = `vmess://${btoa(JSON.stringify(vmessConfig))}`;
            } else if (protocol === 'trojan') {
                 configLink = `trojan://${settings.uuid}@${connectionDomain}:${connectionPort}#${encodeURIComponent(remarkText)}`;
            }

            logs.push(`INFO: Config link generated successfully for protocol ${protocol}.`);
            return { success: true, configLink, logs };

        } else {
            const errorMsg = `ERROR: Failed to create user in panel. API Message: ${data.msg}`;
            logs.push(errorMsg);
            return { success: false, error: data.msg || 'یک خطای ناشناخته در پنل رخ داد.', logs };
        }

    } catch (error: any) {
        const errorMsg = `ERROR: An unknown error occurred during user creation: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای ناشناخته در زمان ساخت کاربر رخ داد: ${error.message}`, logs };
    }
}


export async function renewAlirezaUser(
    server: Server, 
    clientData: { email: string, inboundId: string, expiryTime: number, totalGB: number }
): Promise<{ success: boolean; error?: string, logs: string[] }> {
    const loginResult = await getLoginCookie(server);
    const logs = loginResult.logs;
    if (!loginResult.success) {
        return { success: false, error: loginResult.error, logs };
    }

    try {
        logs.push(`INFO: Attempting to renew user ${clientData.email} on inbound ${clientData.inboundId}`);
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        
        // 1. Get the specific inbound to find the client's UUID (id)
        const getInboundUrl = new URL(`xui/API/inbounds/get/${clientData.inboundId}`, baseUrl).href;
        const inboundResponse = await fetch(getInboundUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Cookie': loginResult.cookie! },
            cache: 'no-store',
        });

        if (!inboundResponse.ok) {
            const errorMsg = `ERROR: Failed to fetch inbound data. Status: ${inboundResponse.status}`;
            logs.push(errorMsg);
            return { success: false, error: 'اطلاعات اینباند برای یافتن کاربر دریافت نشد.', logs };
        }
        
        const inboundData: AlirezaAPIResponse = await inboundResponse.json();
        if (!inboundData.success || !inboundData.obj) {
            const errorMsg = `ERROR: Failed to get a valid inbound object. Msg: ${inboundData.msg}`;
            logs.push(errorMsg);
            return { success: false, error: `آبجکت اینباند معتبری دریافت نشد: ${inboundData.msg}`, logs };
        }

        const inbound = inboundData.obj;
        const clientSettings = JSON.parse(inbound.settings);
        const client = clientSettings.clients.find((c: any) => c.email === clientData.email);

        if (!client) {
             const errorMsg = `ERROR: Client with email ${clientData.email} not found in inbound ${clientData.inboundId}.`;
             logs.push(errorMsg);
             return { success: false, error: `کاربری با این شناسه در اینباند یافت نشد.`, logs };
        }

        // 2. Update the client with new data
        const updateClientUrl = new URL(`xui/API/inbounds/updateClient/${client.id}`, baseUrl).href;
        
        const clientUpdatePayload = {
            id: parseInt(clientData.inboundId, 10),
            settings: JSON.stringify({
                clients: [{
                    id: client.id,
                    email: clientData.email,
                    enable: true,
                    totalGB: clientData.totalGB,
                    expiryTime: clientData.expiryTime,
                    flow: client.flow || '',
                    limitIp: client.limitIp || 0,
                    tgId: client.tgId || "",
                    subId: client.subId || ""
                }]
            })
        };
        
        logs.push(`INFO: Update client request body: ${JSON.stringify(clientUpdatePayload)}`);

        const updateResponse = await fetch(updateClientUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': loginResult.cookie! },
            body: JSON.stringify(clientUpdatePayload),
            cache: 'no-store'
        });
        
        const updateText = await updateResponse.text();
        logs.push(`INFO: Update client response: ${updateText}`);
        const updateData: AlirezaAPIResponse = JSON.parse(updateText);

        if (!updateData.success) {
            const errorMsg = `ERROR: Failed to update client. API message: ${updateData.msg}`;
            logs.push(errorMsg);
            return { success: false, error: `خطا در به‌روزرسانی کاربر در پنل: ${updateData.msg}`, logs };
        }
        
        logs.push(`INFO: Successfully updated client ${clientData.email}. Now resetting traffic.`);
        
        // 3. Reset client traffic
        const resetTrafficUrl = new URL(`xui/API/inbounds/${clientData.inboundId}/resetClientTraffic/${clientData.email}`, baseUrl).href;
        const resetResponse = await fetch(resetTrafficUrl, {
            method: 'POST',
            headers: { 'Cookie': loginResult.cookie! },
            cache: 'no-store',
        });
        
        const resetText = await resetResponse.text();
        logs.push(`INFO: Reset traffic response: ${resetText}`);
        const resetData: AlirezaAPIResponse = JSON.parse(resetText);

        if (resetData.success) {
            logs.push(`INFO: Successfully reset traffic for client ${clientData.email}. Renewal complete.`);
            return { success: true, logs };
        } else {
             const errorMsg = `ERROR: Failed to reset traffic, but client was updated. API message: ${resetData.msg}`;
            logs.push(errorMsg);
            // We can decide if this is a critical failure. For now, let's report success but with a warning in the toast.
            return { success: true, error: `ترافیک ریست نشد: ${resetData.msg}`, logs };
        }


    } catch (error: any) {
        const errorMsg = `ERROR: An unknown error occurred during renewal: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای ناشناخته در زمان تمدید رخ داد: ${error.message}`, logs };
    }
}


export async function getAlirezaClientTraffic(
    server: Server,
    clientEmail: string
): Promise<{ success: boolean; error?: string; data?: TrafficInfo }> {
    const { success, error, cookie } = await getLoginCookie(server);
    if (!success) {
        return { success: false, error };
    }

    try {
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        const trafficUrl = new URL(`xui/API/inbounds/getClientTraffics/${clientEmail}`, baseUrl).href;

        const trafficResponse = await fetch(trafficUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Cookie': cookie! },
            cache: 'no-store',
        });

        if (!trafficResponse.ok) {
            return { success: false, error: `خطا در دریافت اطلاعات ترافیک: ${trafficResponse.status} ${trafficResponse.statusText}` };
        }

        const trafficData: AlirezaAPIResponse = await trafficResponse.json();

        if (trafficData.success && trafficData.obj) {
            return { success: true, data: trafficData.obj as TrafficInfo };
        } else {
            return { success: false, error: `خطا در API دریافت ترافیک: ${trafficData.msg}` };
        }

    } catch (error: any) {
        return { success: false, error: `یک خطای ناشناخته در حین دریافت ترافیک رخ داد: ${error.message}` };
    }
}


export async function deleteAlirezaUser(
    server: Server, 
    clientData: { email: string, inboundId: string }
): Promise<{ success: boolean; error?: string, logs: string[] }> {
    const loginResult = await getLoginCookie(server);
    const logs = loginResult.logs;
    if (!loginResult.success) {
        return { success: false, error: loginResult.error, logs };
    }

    try {
        logs.push(`INFO: Attempting to delete user ${clientData.email} from inbound ${clientData.inboundId}`);
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);

        const getInboundUrl = new URL(`xui/API/inbounds/get/${clientData.inboundId}`, baseUrl).href;
        const inboundResponse = await fetch(getInboundUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Cookie': loginResult.cookie! },
            cache: 'no-store',
        });
        const inboundData: AlirezaAPIResponse = await inboundResponse.json();

        if (!inboundData.success || !inboundData.obj) {
            logs.push(`WARN: Could not find inbound to get client UUID, attempting to delete by email anyway. Msg: ${inboundData.msg}`);
        }
        
        const inbound = inboundData.obj;
        const clientSettings = inbound ? JSON.parse(inbound.settings) : null;
        const client = clientSettings ? clientSettings.clients.find((c: any) => c.email === clientData.email) : null;
        
        if (!client) {
            logs.push(`WARN: Client with email ${clientData.email} not found in inbound ${clientData.inboundId}. It might have been already deleted.`);
            // If the client doesn't exist, we consider it a "success" for the deletion process.
            return { success: true, logs, error: 'کاربر در پنل یافت نشد (ممکن است قبلاً حذف شده باشد).' };
        }

        const deleteClientUrl = new URL(`xui/API/inbounds/${clientData.inboundId}/delClient/${client.id}`, baseUrl).href;
        logs.push(`INFO: Sending DELETE request to: ${deleteClientUrl}`);
        
        const deleteResponse = await fetch(deleteClientUrl, {
            method: 'POST', // The documentation indicates POST for this action
            headers: { 'Cookie': loginResult.cookie! },
            cache: 'no-store',
        });

        const deleteText = await deleteResponse.text();
        logs.push(`INFO: Delete client response: ${deleteText}`);
        const deleteData: AlirezaAPIResponse = JSON.parse(deleteText);
        
        if (deleteData.success) {
            logs.push(`INFO: Successfully deleted client ${clientData.email}.`);
            return { success: true, logs };
        } else {
            const errorMsg = `ERROR: Failed to delete client. API Message: ${deleteData.msg}`;
            logs.push(errorMsg);
            return { success: false, error: `خطا در حذف کاربر از پنل: ${deleteData.msg}`, logs };
        }
    } catch (error: any) {
        const errorMsg = `ERROR: An unknown error occurred during user deletion: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای ناشناخته در زمان حذف کاربر رخ داد: ${error.message}`, logs };
    }
}
