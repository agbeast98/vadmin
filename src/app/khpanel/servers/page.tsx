
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Server as ServerIcon, PlusCircle, File, MoreHorizontal, Trash2, Edit, Wifi, WifiOff, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Server, PanelType } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { SERVERS_STORAGE_KEY } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supportedPanelTypes } from '@/lib/types';
import { panelDetails } from '@/lib/panels';
import { testServerConnection } from '@/lib/actions';


type ServerWithStatus = Server & {
    connectionStatus: 'online' | 'offline' | 'testing';
};

export default function ServersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [servers, setServers] = React.useState<ServerWithStatus[]>([]);
  const [isServerDialogOpen, setIsServerDialogOpen] = React.useState(false);
  const [editingServer, setEditingServer] = React.useState<Server | null>(null);

  // Form state for dialog
  const [serverName, setServerName] = React.useState('');
  const [panelType, setPanelType] = React.useState<PanelType | ''>('');
  const [panelUrl, setPanelUrl] = React.useState('');
  const [panelUser, setPanelUser] = React.useState('');
  const [panelPass, setPanelPass] = React.useState('');

  const handleTestConnection = React.useCallback(async (serverToTest: Server, showToast = true) => {
    if (!serverToTest) {
        return;
    }

    setServers(prev => prev.map(s => s.id === serverToTest.id ? { ...s, connectionStatus: 'testing' } : s));

    const result = await testServerConnection(serverToTest);
    
    setServers(prev => prev.map(s => {
        if (s.id === serverToTest.id) {
            return { 
                ...s, 
                status: result.success ? 'online' : 'offline',
                onlineUsers: result.onlineUsers ?? 0,
                connectionStatus: result.success ? 'online' : 'offline', 
            };
        }
        return s;
    }));

    if (showToast) {
        if (result.success) {
            toast({
                title: 'اتصال موفق',
                description: `اتصال به سرور "${serverToTest.name}" با موفقیت برقرار شد.`,
            });
        } else {
            toast({
                title: 'اتصال ناموفق',
                description: result.error || 'یک خطای ناشناخته در اتصال رخ داد.',
                variant: 'destructive',
            });
        }
    }
  }, [toast]);
  
  // Load servers from localStorage and test them on initial load
  React.useEffect(() => {
    let isMounted = true;
    try {
      const storedServers = localStorage.getItem(SERVERS_STORAGE_KEY);
      if (storedServers) {
        const parsedServers: Server[] = JSON.parse(storedServers);
        const serversWithStatus = parsedServers.map(s => ({ ...s, connectionStatus: 'testing' as const, status: 'offline' as const, onlineUsers: s.onlineUsers || 0 }));
        
        if (isMounted) {
            setServers(serversWithStatus);
            // Test all servers on load
            serversWithStatus.forEach(server => {
                handleTestConnection(server, false); // false to suppress toast
            });
        }
      }
    } catch (error) {
        if (isMounted) {
            toast({
                title: 'خطا در بارگذاری',
                description: 'مشکلی در خواندن اطلاعات سرورها از حافظه رخ داد.',
                variant: 'destructive',
            });
        }
    }
     return () => {
        isMounted = false;
    };
  }, [handleTestConnection, toast]);
  
  const updateServersState = (updatedServers: ServerWithStatus[]) => {
      setServers(updatedServers);
      // Save only the base server data, not the connection status
      const serversToStore = updatedServers.map(({ connectionStatus, ...rest }) => rest);
      localStorage.setItem(SERVERS_STORAGE_KEY, JSON.stringify(serversToStore));
  }

  const resetServerForm = () => {
    setServerName('');
    setPanelType('');
    setPanelUrl('');
    setPanelUser('');
    setPanelPass('');
    setEditingServer(null);
  };

  const handleOpenServerDialog = (server: Server | null = null) => {
    if (server) {
      setEditingServer(server);
      setServerName(server.name);
      setPanelType(server.panelType);
      setPanelUrl(server.panelUrl || '');
      setPanelUser(server.panelUser || '');
      setPanelPass(server.panelPass || '');
    } else {
      resetServerForm();
    }
    setIsServerDialogOpen(true);
  };

  const handleSaveServer = () => {
    if (!serverName || !panelType || !panelUrl) {
      toast({ title: 'خطا', description: 'لطفاً تمام فیلدهای ضروری را پر کنید.', variant: 'destructive' });
      return;
    }

    let updatedServers: ServerWithStatus[];
    if (editingServer) {
      const updatedServer: ServerWithStatus = {
        ...(servers.find(s => s.id === editingServer.id)!),
        name: serverName,
        panelType: panelType,
        panelUrl,
        panelUser,
        panelPass,
        connectionStatus: 'testing',
      };
      updatedServers = servers.map(s => (s.id === editingServer.id ? updatedServer : s));
      toast({ title: 'موفقیت‌آمیز', description: 'سرور با موفقیت ویرایش شد.' });
      handleTestConnection(updatedServer, false);
    } else {
      const newServer: ServerWithStatus = {
        id: `server-${Date.now()}-${Math.random()}`,
        name: serverName,
        panelType: panelType,
        status: 'offline', // Default status
        onlineUsers: 0,
        panelUrl,
        panelUser,
        panelPass,
        connectionStatus: 'testing'
      };
      updatedServers = [...servers, newServer];
      toast({ title: 'موفقیت‌آمیز', description: 'سرور جدید با موفقیت اضافه شد.' });
      handleTestConnection(newServer, false);
    }

    updateServersState(updatedServers);
    setIsServerDialogOpen(false);
    resetServerForm();
  };

  const handleDeleteServer = (serverId: string) => {
    const updatedServers = servers.filter(s => s.id !== serverId);
    updateServersState(updatedServers);
    toast({ title: 'موفقیت‌آمیز', description: 'سرور مورد نظر حذف شد.' });
  };
  
   React.useEffect(() => {
    if (!isServerDialogOpen) {
      resetServerForm();
    }
  }, [isServerDialogOpen]);


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <ServerIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت سرورها</h1>
              <p className="text-muted-foreground">
                سرورها و پنل‌های خود را در این بخش مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isServerDialogOpen} onOpenChange={setIsServerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenServerDialog()}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  سرور جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingServer ? 'ویرایش سرور' : 'افزودن سرور جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="server-name">نام سرور</Label>
                    <Input id="server-name" value={serverName} onChange={e => setServerName(e.target.value)} placeholder="مثلاً: سرور آلمان" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-type">نوع پنل</Label>
                    <Select value={panelType} onValueChange={(value) => setPanelType(value as PanelType)}>
                      <SelectTrigger id="panel-type">
                        <SelectValue placeholder="نوع پنل را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedPanelTypes.map(type => (
                           <SelectItem key={type} value={type}>{panelDetails[type].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel-url">آدرس پنل</Label>
                    <Input id="panel-url" value={panelUrl} onChange={e => setPanelUrl(e.target.value)} placeholder="http://your-server-ip:54321" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="panel-user">نام کاربری پنل</Label>
                    <Input id="panel-user" value={panelUser} onChange={e => setPanelUser(e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="panel-pass">رمز عبور پنل</Label>
                    <Input id="panel-pass" type="password" value={panelPass} onChange={e => setPanelPass(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveServer}>{editingServer ? 'ذخیره تغییرات' : 'افزودن سرور'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>لیست سرورها</CardTitle>
            <CardDescription>
              در این جدول می‌توانید لیست کامل سرورهای متصل به پنل را مشاهده کنید.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام سرور</TableHead>
                  <TableHead>نوع پنل</TableHead>
                  <TableHead>وضعیت اتصال</TableHead>
                  <TableHead>کاربران آنلاین</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      هنوز هیچ سروری اضافه نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  servers.map(server => (
                    <TableRow key={server.id}>
                      <TableCell className="font-medium">{server.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{server.panelType ? panelDetails[server.panelType].name : '-'}</Badge>
                      </TableCell>
                       <TableCell>
                        {server.connectionStatus === 'online' ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                             <Wifi className="ml-1 h-3 w-3" />
                             آنلاین
                          </Badge>
                        ) : server.connectionStatus === 'testing' ? (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                             <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                             در حال تست...
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <WifiOff className="ml-1 h-3 w-3" />
                            آفلاین
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{server.onlineUsers}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">باز کردن منو</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => handleTestConnection(server, true)}>
                              <Wifi className="mr-2 h-4 w-4" />
                              تست اتصال
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenServerDialog(server)}>
                              <Edit className="mr-2 h-4 w-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteServer(server.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
