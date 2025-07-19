
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Folder, PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';
import { CATEGORIES_STORAGE_KEY } from '@/lib/constants';

export default function CategoriesPage() {
  const { toast } = useToast();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  // Form state
  const [categoryName, setCategoryName] = React.useState('');
  const [categoryStatus, setCategoryStatus] = React.useState<'active' | 'inactive'>('active');

  React.useEffect(() => {
    try {
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch (error) {
      toast({ title: 'خطا', description: 'مشکلی در بارگذاری دسته‌بندی‌ها رخ داد.', variant: 'destructive' });
    }
  }, [toast]);

  const updateCategoriesState = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
  };

  const resetForm = () => {
    setCategoryName('');
    setCategoryStatus('active');
    setEditingCategory(null);
  };

  const handleOpenCategoryDialog = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryStatus(category.status);
    } else {
      resetForm();
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!categoryName) {
      toast({ title: 'خطا', description: 'نام دسته‌بندی نمی‌تواند خالی باشد.', variant: 'destructive' });
      return;
    }

    let updatedCategories: Category[];
    if (editingCategory) {
      const updatedCategory = { ...editingCategory, name: categoryName, status: categoryStatus };
      updatedCategories = categories.map(c => (c.id === editingCategory.id ? updatedCategory : c));
      toast({ title: 'موفقیت‌آمیز', description: 'دسته‌بندی با موفقیت ویرایش شد.' });
    } else {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: categoryName,
        status: categoryStatus,
      };
      updatedCategories = [...categories, newCategory];
      toast({ title: 'موفقیت‌آمیز', description: 'دسته‌بندی جدید با موفقیت اضافه شد.' });
    }

    updateCategoriesState(updatedCategories);
    setIsCategoryDialogOpen(false);
    resetForm();
  };

  const handleDeleteCategory = (categoryId: string) => {
    // TODO: Add a check to see if any plan is using this category before deleting.
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    updateCategoriesState(updatedCategories);
    toast({ title: 'موفقیت‌آمیز', description: 'دسته‌بندی مورد نظر حذف شد.' });
  };
  
  React.useEffect(() => {
    if (!isCategoryDialogOpen) {
      resetForm();
    }
  }, [isCategoryDialogOpen]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">مدیریت دسته‌بندی‌ها</h1>
              <p className="text-muted-foreground">
                دسته‌بندی‌های پلن‌های خود را ایجاد و مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenCategoryDialog()}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  دسته‌بندی جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">نام دسته‌بندی</Label>
                    <Input id="category-name" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="مثلاً: سرویس‌های ویژه" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="category-status">وضعیت</Label>
                    <Switch id="category-status" checked={categoryStatus === 'active'} onCheckedChange={(checked) => setCategoryStatus(checked ? 'active' : 'inactive')} dir="ltr" />
                    <span className="text-sm text-muted-foreground">{categoryStatus === 'active' ? 'فعال' : 'غیرفعال'}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveCategory}>{editingCategory ? 'ذخیره تغییرات' : 'افزودن'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>لیست دسته‌بندی‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام دسته‌بندی</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      هنوز هیچ دسته‌بندی ایجاد نشده است.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        {category.status === 'active' ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">فعال</Badge>
                        ) : (
                          <Badge variant="destructive">غیرفعال</Badge>
                        )}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category.id)}>
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
