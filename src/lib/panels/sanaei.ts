
'use server';

import type { Server, ClientSettings, Plan, TrafficInfo } from '../types';

interface SanaeiLoginResponse {
    success: boolean;
    msg: string;
    obj: any;
}

interface SanaeiAPIResponse {
    success: boolean;
    msg: string;
    obj?: any;
}


interface SanaeiOnlineUsersResponse {
    success: boolean;
    msg: string;
    obj: {
        email: string;
        up: number;
        down: number;
        total: number;
        expiryTime: number;
    }[];
}

async function getLoginCookie(server: Server): Promise<{ success: boolean; cookie?: string; error?: string; logs: string[] }> {
    const logs: string[] = [];
    logs.push(`INFO (Sanaei): Attempting to get login cookie for server: ${server.name} (${server.panelUrl})`);

    if (!server.panelUrl || !server.panelUser || !server.panelPass) {
        const errorMsg = "ERROR (Sanaei): Server connection details (URL, username, password) are incomplete.";
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
        logs.push(`INFO (Sanaei): Attempting to login to URL: ${loginUrl}`);
        
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
            const errorMsg = `ERROR (Sanaei): Login request failed with status: ${loginResponse.status} ${loginResponse.statusText}`;
            logs.push(errorMsg);
            return { success: false, error: `درخواست لاگین با خطا مواجه شد. وضعیت: ${loginResponse.status}`, logs };
        }

        const loginText = await loginResponse.text();
        let loginData: SanaeiLoginResponse;
        try {
            loginData = JSON.parse(loginText);
        } catch (e) {
            const errorMsg = `ERROR (Sanaei): Failed to parse JSON response from server. Response: ${loginText.substring(0, 150)}`;
            logs.push(errorMsg);
            return { success: false, error: `پاسخ دریافتی از سرور معتبر نبود.`, logs };
        }

        if (!loginData.success) {
            const errorMsg = `ERROR (Sanaei): Login failed. API message: ${loginData.msg}`;
            logs.push(errorMsg);
            return { success: false, error: loginData.msg || "نام کاربری یا رمز عبور اشتباه است.", logs };
        }
        
        const cookie = loginResponse.headers.get('Set-Cookie');
        if (!cookie) {
            const errorMsg = "ERROR (Sanaei): Login successful but no session cookie received.";
            logs.push(errorMsg);
            return { success: false, error: "کوکی نشست پس از لاگین دریافت نشد.", logs };
        }

        logs.push("INFO (Sanaei): Login successful, cookie obtained.");
        return { success: true, cookie, logs };

    } catch (error: any) {
         if (error.cause?.code === 'ENOTFOUND') {
            const errorMsg = `ERROR (Sanaei): Host not found: ${server.panelUrl}`;
            logs.push(errorMsg);
            return { success: false, error: `هاست پیدا نشد: ${server.panelUrl}`, logs };
        }
         if (error.cause?.code === 'ECONNREFUSED') {
            const errorMsg = `ERROR (Sanaei): Connection refused for: ${server.panelUrl}`;
            logs.push(errorMsg);
            return { success: false, error: `اتصال به سرور رد شد: ${server.panelUrl}`, logs };
        }
        const errorMsg = `ERROR (Sanaei): An unknown network error occurred: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای شبکه ناشناخته رخ داد: ${error.message}`, logs };
    }
}


/**
 * Tests the connection to a Sanaei X-UI panel based on the latest documentation.
 * Handles different URL formats (IP, domain, with/without path).
 * @param server The server object with connection details.
 * @returns A promise that resolves to an object indicating connection status.
 */
export async function testSanaeiConnection(server: Server): Promise<{ success: boolean; error?: string; onlineUsers?: number }> {
    if (!server.panelUrl || !server.panelUser || !server.panelPass) {
        return { success: false, error: "اطلاعات کامل سرور (آدرس، نام کاربری، رمز عبور) وارد نشده است." };
    }

    try {
        let baseUrlString = server.panelUrl;
        if (!/^https?:\/\//i.test(baseUrlString)) {
            baseUrlString = `http://${baseUrlString}`;
        }
        
        const baseUrl = new URL(baseUrlString);

        // Correct paths based on the new documentation
        const loginUrl = new URL('login', baseUrl).href;
        const onlineUrl = new URL('panel/api/inbounds/onlines', baseUrl).href;

        // --- Step 1: Login to get session cookie ---
        const loginResult = await getLoginCookie(server);
        if(!loginResult.success) {
            return { success: false, error: loginResult.error };
        }

        // --- Step 2: Fetch online users using the cookie ---
        const onlineResponse = await fetch(onlineUrl, {
            method: 'POST', // Correct method is POST as per new documentation
            headers: {
                'Accept': 'application/json',
                'Cookie': loginResult.cookie!,
            },
            cache: 'no-store',
        });

        if (!onlineResponse.ok) {
             const errorText = await onlineResponse.text();
             return { success: false, error: `خطا در دریافت کاربران آنلاین: ${onlineResponse.status} ${onlineResponse.statusText}. Response: ${errorText}` };
        }

        const onlineData: SanaeiOnlineUsersResponse = await onlineResponse.json();

        if (onlineData.success) {
            const onlineCount = onlineData.obj ? onlineData.obj.length : 0;
            return { success: true, onlineUsers: onlineCount };
        } else {
            return { success: false, error: `خطا در API کاربران آنلاین: ${onlineData.msg}` };
        }

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


export async function createSanaeiUser(server: Server, plan: Plan, settings: ClientSettings): Promise<{ success: boolean; error?: string, configLink?: string, logs: string[] }> {
    const loginResult = await getLoginCookie(server);
    let logs = loginResult.logs;
    if (!loginResult.success) {
        return { success: false, error: loginResult.error, logs };
    }
    
    try {
        logs.push(`INFO (Sanaei): Attempting to create user ${settings.email} on inbound ${settings.id}`);
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        const addClientUrl = new URL('panel/api/inbounds/addClient/', baseUrl).href;
        
        const clientSettingsObject = {
            clients: [{
                id: settings.uuid,
                email: settings.email,
                totalGB: settings.totalGB,
                expiryTime: settings.expiryTime,
                enable: true,
                flow: '', 
                limitIp: 0,
                tgId: "",
                subId: ""
            }]
        };

        const bodyToSend = {
            id: parseInt(settings.id, 10),
            settings: JSON.stringify(clientSettingsObject)
        };
        
        logs.push(`INFO (Sanaei): Add client request body: ${JSON.stringify(bodyToSend)}`);

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
        logs.push(`INFO (Sanaei): Add client response: ${responseText}`);
        let data: SanaeiAPIResponse;
        try {
            data = JSON.parse(responseText);
        } catch(e) {
            const errorMsg = `ERROR (Sanaei): Failed to parse JSON response from addClient. Response: ${responseText}`;
            logs.push(errorMsg);
            return { success: false, error: `پاسخ دریافتی از سرور هنگام ساخت کاربر معتبر نبود.`, logs };
        }

        if (data.success) {
            logs.push("INFO (Sanaei): User created successfully. Generating config link based on plan details.");

            const { protocol } = plan;
            const connectionDomain = plan.connectionDomain || server.publicDomain || new URL(server.panelUrl!).hostname;
            const connectionPort = plan.connectionPort;
            const remark = plan.remark;
            
            if (!protocol || !connectionDomain || !connectionPort) {
                const errorMsg = 'WARN (Sanaei): User created, but plan or server is missing connection details (protocol, domain, port).';
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

            logs.push(`INFO (Sanaei): Config link generated successfully for protocol ${protocol}.`);
            return { success: true, configLink, logs };

        } else {
            const errorMsg = `ERROR (Sanaei): Failed to create user in panel. API Message: ${data.msg}`;
            logs.push(errorMsg);
            return { success: false, error: data.msg || 'یک خطای ناشناخته در پنل رخ داد.', logs };
        }

    } catch (error: any) {
        const errorMsg = `ERROR (Sanaei): An unknown error occurred during user creation: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای ناشناخته در زمان ساخت کاربر رخ داد: ${error.message}`, logs };
    }
}


export async function getSanaeiClientTraffic(
    server: Server,
    clientEmail: string
): Promise<{ success: boolean; error?: string; data?: TrafficInfo; logs?: string[] }> {
    const loginResult = await getLoginCookie(server);
    const logs = loginResult.logs || [];
    if (!loginResult.success) {
        return { success: false, error: loginResult.error, logs };
    }

    try {
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        const trafficUrl = new URL(`panel/api/inbounds/getClientTraffics/${clientEmail}`, baseUrl).href;
        logs.push(`INFO (Sanaei): Fetching traffic from ${trafficUrl}`);

        const trafficResponse = await fetch(trafficUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Cookie': loginResult.cookie! },
            cache: 'no-store',
        });
        
        const responseText = await trafficResponse.text();
        logs.push(`INFO (Sanaei): Traffic response: ${responseText.substring(0, 200)}`);

        if (!trafficResponse.ok) {
            logs.push(`ERROR (Sanaei): Failed to get traffic. Status: ${trafficResponse.status}`);
            return { success: false, error: `خطا در دریافت اطلاعات ترافیک: ${trafficResponse.status} ${trafficResponse.statusText}`, logs };
        }

        const trafficData: SanaeiAPIResponse = JSON.parse(responseText);

        if (trafficData.success && trafficData.obj) {
            logs.push(`INFO (Sanaei): Successfully fetched traffic for ${clientEmail}`);
            // The Sanaei panel returns the traffic object directly, which matches our TrafficInfo type.
            return { success: true, data: trafficData.obj as TrafficInfo, logs };
        } else {
            // Handle cases where the user is not found, which is a common scenario.
            if (trafficData.msg && trafficData.msg.includes("client not found")) {
                 logs.push(`WARN (Sanaei): Client ${clientEmail} not found on panel.`);
                 return { success: false, error: "کاربر در اینباند پنل یافت نشد.", logs };
            }
            logs.push(`ERROR (Sanaei): API returned an error: ${trafficData.msg}`);
            return { success: false, error: `خطا در API دریافت ترافیک: ${trafficData.msg}`, logs };
        }

    } catch (error: any) {
        logs.push(`ERROR (Sanaei): An unknown error occurred while fetching traffic: ${error.message}`);
        return { success: false, error: `یک خطای ناشناخته در حین دریافت ترافیک رخ داد: ${error.message}`, logs };
    }
}

async function getSanaeiClient(server: Server, cookie: string, inboundId: string, clientEmail: string): Promise<{ success: boolean; client?: any; logs: string[] }> {
    const logs = [];
    try {
        logs.push(`INFO (Sanaei): Fetching client '${clientEmail}' from inbound ${inboundId}.`);
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        const getInboundUrl = new URL(`panel/api/inbounds/get/${inboundId}`, baseUrl).href;
        const inboundResponse = await fetch(getInboundUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Cookie': cookie },
            cache: 'no-store',
        });
        if (!inboundResponse.ok) {
            const errorMsg = `ERROR (Sanaei): Failed to fetch inbound to find client. Status: ${inboundResponse.status}`;
            logs.push(errorMsg);
            return { success: false, logs };
        }
        const inboundData = await inboundResponse.json();
        if (!inboundData.success || !inboundData.obj) {
            const errorMsg = `ERROR (Sanaei): API call to get inbound was not successful. Msg: ${inboundData.msg}`;
            logs.push(errorMsg);
            return { success: false, logs };
        }
        const settings = JSON.parse(inboundData.obj.settings);
        const client = settings.clients.find((c: any) => c.email === clientEmail);
        if (!client) {
            const errorMsg = `ERROR (Sanaei): Client with email ${clientEmail} not found in inbound ${inboundId}.`;
            logs.push(errorMsg);
            return { success: false, logs };
        }
        logs.push(`INFO (Sanaei): Successfully found client UUID (id): ${client.id}`);
        return { success: true, client, logs };
    } catch (error: any) {
        logs.push(`ERROR (Sanaei): Exception while getting client: ${error.message}`);
        return { success: false, logs };
    }
}


export async function renewSanaeiUser(
    server: Server, 
    clientData: { email: string, inboundId: string, expiryTime: number, totalGB: number }
): Promise<{ success: boolean; error?: string, logs: string[] }> {
    const loginResult = await getLoginCookie(server);
    let logs = loginResult.logs;
    if (!loginResult.success) {
        return { success: false, error: loginResult.error, logs };
    }

    try {
        logs.push(`INFO (Sanaei): Attempting to renew user ${clientData.email} on inbound ${clientData.inboundId}`);
        const baseUrl = new URL(server.panelUrl!.startsWith('http') ? server.panelUrl! : `http://${server.panelUrl!}`);
        
        // Step 1: Get the client's UUID (id) because the update API requires it.
        const clientResult = await getSanaeiClient(server, loginResult.cookie!, clientData.inboundId, clientData.email);
        logs = [...logs, ...clientResult.logs];
        if (!clientResult.success || !clientResult.client) {
            return { success: false, error: 'کاربر مورد نظر برای تمدید در پنل یافت نشد.', logs };
        }
        
        const clientUUID = clientResult.client.id;
        
        // Step 2: Use the correct endpoint for updating: /updateClient/:clientId
        // According to the docs, clientId is the client.id (UUID) for VLESS/VMESS.
        const updateClientUrl = new URL(`panel/api/inbounds/updateClient/${clientUUID}`, baseUrl).href;
        
        const clientUpdatePayload = {
            id: parseInt(clientData.inboundId, 10),
            settings: JSON.stringify({
                clients: [{
                    id: clientUUID,
                    email: clientData.email,
                    enable: true,
                    totalGB: clientData.totalGB,
                    expiryTime: clientData.expiryTime,
                    flow: clientResult.client.flow || '',
                    limitIp: clientResult.client.limitIp || 0,
                    tgId: clientResult.client.tgId || "",
                    subId: clientResult.client.subId || ""
                }]
            })
        };
        
        logs.push(`INFO (Sanaei): Update client URL: ${updateClientUrl}`);
        logs.push(`INFO (Sanaei): Update client request body: ${JSON.stringify(clientUpdatePayload)}`);

        const updateResponse = await fetch(updateClientUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': loginResult.cookie! },
            body: JSON.stringify(clientUpdatePayload),
            cache: 'no-store'
        });
        
        const updateText = await updateResponse.text();
        logs.push(`INFO (Sanaei): Update client response: ${updateText}`);
        const updateData: SanaeiAPIResponse = JSON.parse(updateText);

        if (!updateData.success) {
            const errorMsg = `ERROR (Sanaei): Failed to update client. API message: ${updateData.msg}`;
            logs.push(errorMsg);
            return { success: false, error: `خطا در به‌روزرسانی کاربر در پنل: ${updateData.msg}`, logs };
        }
        
        logs.push(`INFO (Sanaei): Successfully updated client ${clientData.email}. Now resetting traffic.`);
        
        // Step 3: Reset traffic
        const resetTrafficUrl = new URL(`panel/api/inbounds/${clientData.inboundId}/resetClientTraffic/${clientData.email}`, baseUrl).href;
        const resetResponse = await fetch(resetTrafficUrl, {
            method: 'POST',
            headers: { 'Cookie': loginResult.cookie! },
            cache: 'no-store',
        });
        
        const resetText = await resetResponse.text();
        logs.push(`INFO (Sanaei): Reset traffic response: ${resetText}`);
        const resetData: SanaeiAPIResponse = JSON.parse(resetText);

        if (resetData.success) {
            logs.push(`INFO (Sanaei): Successfully reset traffic for client ${clientData.email}. Renewal complete.`);
            return { success: true, logs };
        } else {
            const errorMsg = `ERROR (Sanaei): Failed to reset traffic, but client was updated. API message: ${resetData.msg}`;
            logs.push(errorMsg);
            return { success: true, error: `ترافیک ریست نشد: ${resetData.msg}`, logs };
        }

    } catch (error: any) {
        const errorMsg = `ERROR (Sanaei): An unknown error occurred during renewal: ${error.message}`;
        logs.push(errorMsg);
        return { success: false, error: `یک خطای ناشناخته در زمان تمدید رخ داد: ${error.message}`, logs };
    }
}
