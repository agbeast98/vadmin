
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PackagePlus, PlusCircle, MoreHorizontal, Trash2, Edit, FolderPlus, ListPlus } from 'lucide-react';
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
import type { PreMadeItemGroup, PreMadeItem } from '@/lib/types';
import { PRE_MADE_ITEM_GROUPS_STORAGE_KEY, PRE_MADE_ITEMS_STORAGE_KEY } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PreMadeItemsPage() {
  const { toast } = useToast();

  const [groups, setGroups] = React.useState<PreMadeItemGroup[]>([]);
  const [items, setItems] = React.useState<PreMadeItem[]>([]);
  
  const [isGroupDialogOpen, setIsGroupDialogOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<PreMadeItemGroup | null>(null);
  const [groupName, setGroupName] = React.useState('');

  const [isItemDialogOpen, setIsItemDialogOpen] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState('');
  const [itemContent, setItemContent] = React.useState('');

  React.useEffect(() => {
    try {
      const storedGroups = localStorage.getItem(PRE_MADE_ITEM_GROUPS_STORAGE_KEY);
      if (storedGroups) setGroups(JSON.parse(storedGroups));

      const storedItems = localStorage.getItem(PRE_MADE_ITEMS_STORAGE_KEY);
      if (storedItems) setItems(JSON.parse(storedItems));
    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری اطلاعات اولیه رخ داد.', variant: 'destructive' });
    }
  }, [toast]);

  // --- Group Management ---
  const updateGroupsState = (updatedGroups: PreMadeItemGroup[]) => {
    setGroups(updatedGroups);
    localStorage.setItem(PRE_MADE_ITEM_GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
  };
  
  const resetGroupForm = () => {
    setGroupName('');
    setEditingGroup(null);
  }

  const handleOpenGroupDialog = (group: PreMadeItemGroup | null = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
    } else {
      resetGroupForm();
    }
    setIsGroupDialogOpen(true);
  };
  
  const handleSaveGroup = () => {
    if (!groupName) {
      toast({ title: 'خطا', description: 'نام گروه نمی‌تواند خالی باشد.', variant: 'destructive' });
      return;
    }
    let updatedGroups: PreMadeItemGroup[];
    if (editingGroup) {
      updatedGroups = groups.map(g => g.id === editingGroup.id ? { ...g, name: groupName } : g);
      toast({ title: 'موفقیت‌آمیز', description: 'گروه با موفقیت ویرایش شد.' });
    } else {
      const newGroup: PreMadeItemGroup = { id: `pmg-${Date.now()}`, name: groupName };
      updatedGroups = [...groups, newGroup];
      toast({ title: 'موفقیت‌آمیز', description: 'گروه جدید ایجاد شد.' });
    }
    updateGroupsState(updatedGroups);
    setIsGroupDialogOpen(false);
  }
  
  const handleDeleteGroup = (groupId: string) => {
    // TODO: Add warning if group contains items
    const updatedGroups = groups.filter(g => g.id !== groupId);
    updateGroupsState(updatedGroups);
    toast({ title: 'موفقیت‌آمیز', description: 'گروه حذف شد.'});
  }

  React.useEffect(() => { if (!isGroupDialogOpen) resetGroupForm() }, [isGroupDialogOpen]);

  // --- Item Management ---
  const updateItemsState = (updatedItems: PreMadeItem[]) => {
    setItems(updatedItems);
    localStorage.setItem(PRE_MADE_ITEMS_STORAGE_KEY, JSON.stringify(updatedItems));
  }

  const resetItemForm = () => {
    setSelectedGroupId('');
    setItemContent('');
  }

  const handleOpenItemDialog = () => {
    resetItemForm();
    setIsItemDialogOpen(true);
  }
  
  const handleSaveItem = () => {
    if (!selectedGroupId || !itemContent) {
        toast({ title: 'خطا', description: 'لطفا گروه و محتوای آیتم را وارد کنید.', variant: 'destructive' });
        return;
    }

    const newItem: PreMadeItem = {
        id: `pmi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        groupId: selectedGroupId,
        content: itemContent.trim(),
        status: 'available'
    };

    const updatedItems = [...items, newItem];
    updateItemsState(updatedItems);
    toast({ title: 'موفقیت‌آمیز', description: `آیتم جدید با موفقیت اضافه شد.`});
    setIsItemDialogOpen(false);
  }
  
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter(i => i.id !== itemId);
    updateItemsState(updatedItems);
    toast({ title: 'موفقیت‌آمیز', description: 'آیتم مورد نظر حذف شد.' });
  }

  React.useEffect(() => { if (!isItemDialogOpen) resetItemForm() }, [isItemDialogOpen]);
  
  const getGroupName = (groupId: string) => groups.find(g => g.id === groupId)?.name || 'نامشخص';
  const getAvailableCount = (groupId: string) => items.filter(i => i.groupId === groupId && i.status === 'available').length;
  const getTotalCount = (groupId: string) => items.filter(i => i.groupId === groupId).length;


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <PackagePlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت موجودی آماده</h1>
              <p className="text-muted-foreground">
                گروه‌ها و آیتم‌های آماده فروش خود را در این بخش مدیریت کنید.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="groups">
          <div className="flex justify-between items-end">
            <TabsList>
              <TabsTrigger value="groups">مدیریت گروه‌ها</TabsTrigger>
              <TabsTrigger value="items">مدیریت آیتم‌ها</TabsTrigger>
            </TabsList>
             <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleOpenGroupDialog()}>
                        <FolderPlus className="ml-2 h-4 w-4" />
                        گروه جدید
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>{editingGroup ? 'ویرایش گروه' : 'افزودن گروه جدید'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">نام گروه</Label>
                        <Input id="group-name" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="مثلاً: کانفیگ‌های آلمان" />
                    </div>
                    </div>
                    <DialogFooter>
                    <Button onClick={handleSaveGroup}>{editingGroup ? 'ذخیره تغییرات' : 'ایجاد گروه'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
          
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle>لیست گروه‌ها</CardTitle>
                 <CardDescription>
                    گروه‌هایی برای دسته‌بندی آیتم‌های آماده خود ایجاد کنید.
                 </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام گروه</TableHead>
                      <TableHead>تعداد موجود / کل</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="h-24 text-center">هیچ گروهی ایجاد نشده است.</TableCell></TableRow>
                    ) : (
                      groups.map(group => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getAvailableCount(group.id)}</Badge>
                            <span className="mx-1">/</span>
                            <Badge variant="outline">{getTotalCount(group.id)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenGroupDialog(group)}><Edit className="mr-2 h-4 w-4" />ویرایش</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGroup(group.id)}><Trash2 className="mr-2 h-4 w-4" />حذف</DropdownMenuItem>
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
          </TabsContent>
          
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>لیست آیتم‌ها</CardTitle>
                        <CardDescription>
                            آیتم‌های آماده فروش را در این بخش مشاهده و مدیریت کنید.
                        </CardDescription>
                    </div>
                     <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenItemDialog}>
                                <ListPlus className="ml-2 h-4 w-4" />
                                افزودن آیتم جدید
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                             <DialogHeader>
                                <DialogTitle>افزودن آیتم جدید</DialogTitle>
                                <DialogDescription>
                                    گروه مورد نظر را انتخاب کرده و محتوای آیتم را وارد کنید. این محتوا می‌تواند شامل لینک، آموزش یا هر متن دیگری باشد.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="item-group">انتخاب گروه</Label>
                                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                        <SelectTrigger id="item-group">
                                            <SelectValue placeholder="گروه را انتخاب کنید" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="item-content">محتوای آیتم</Label>
                                    <Textarea id="item-content" value={itemContent} onChange={e => setItemContent(e.target.value)} rows={10} placeholder="لینک کانفیگ، اطلاعات اتصال، آموزش و ..."/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveItem}>ذخیره آیتم</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>محتوا (بخشی)</TableHead>
                      <TableHead>گروه</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {items.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-24 text-center">هیچ آیتمی یافت نشد.</TableCell></TableRow>
                    ) : (
                      items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs max-w-xs truncate" title={item.content}>{item.content}</TableCell>
                          <TableCell>{getGroupName(item.groupId)}</TableCell>
                          <TableCell>
                            {item.status === 'available' ? (
                              <Badge variant="outline" className="text-green-500 border-green-500">موجود</Badge>
                            ) : (
                              <Badge variant="destructive">فروخته شده</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
