
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet, CreditCard, Copy, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { TopUpRequest, BankAccount } from '@/lib/types';
import { addTopUpRequest } from '@/lib/data-service';
import { Textarea } from '@/components/ui/textarea';

export default function WalletPage() {
  const { toast } = useToast();
  const { user, financialSettings } = useAuth();
  const [amount, setAmount] = React.useState('');
  const [receiptDetails, setReceiptDetails] = React.useState('');
  const [step, setStep] = React.useState(1);
  const [randomAccount, setRandomAccount] = React.useState<BankAccount | null>(null);
  
  // Select a random account on the client side to avoid hydration mismatch
  React.useEffect(() => {
    if (step === 2 && financialSettings.accounts && financialSettings.accounts.length > 0) {
      const randomIndex = Math.floor(Math.random() * financialSettings.accounts.length);
      setRandomAccount(financialSettings.accounts[randomIndex]);
    }
  }, [step, financialSettings.accounts]);

  const handleNextStep = () => {
    if (!amount || Number(amount) < 1000) {
      toast({
        title: 'خطا',
        description: 'لطفاً یک مبلغ معتبر (حداقل ۱,۰۰۰ تومان) وارد کنید.',
        variant: 'destructive',
      });
      return;
    }
    setStep(2);
  };
  
  const handleFinalSubmit = async () => {
    if (!user) return;
    if (!receiptDetails.trim()) {
       toast({
        title: 'خطا',
        description: 'لطفاً جزئیات رسید پرداخت را وارد کنید.',
        variant: 'destructive',
      });
      return;
    }
    
    const newRequest: TopUpRequest = {
        id: `topup-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        amount: Number(amount),
        receiptDetails: receiptDetails,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayedAccount: randomAccount || undefined,
    };
    
    const result = await addTopUpRequest(newRequest);

    if (result.success) {
        toast({
            title: 'درخواست شما ثبت شد',
            description: 'درخواست افزایش موجودی شما با موفقیت ثبت شد و پس از بررسی توسط مدیر، نتیجه اعلام خواهد شد.',
        });
        // Reset form
        setAmount('');
        setReceiptDetails('');
        setStep(1);
    } else {
        toast({ title: 'خطا', description: result.error, variant: 'destructive'});
    }
  }
  
  const formatCurrency = (value?: number) => {
      if (value === undefined) return '۰ تومان';
      return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
  }

  const copyToClipboard = (text: string) => {
    if (!text) {
        toast({ title: 'خطا', description: 'شماره کارتی برای کپی کردن تنظیم نشده است.', variant: 'destructive'});
        return;
    }
    navigator.clipboard.writeText(text.replace(/[-\s]/g, ''));
    toast({ title: 'کپی شد!', description: 'شماره کارت در کلیپ‌بورد شما کپی شد.' });
  }

  const renderStepOne = () => (
     <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>۱. تعیین مبلغ شارژ</CardTitle>
          <CardDescription>
            مبلغ مورد نظر برای شارژ را به تومان وارد کرده و روی دکمه ادامه کلیک کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">مبلغ (تومان)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثلاً: 50000"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setAmount('50000')}>۵۰,۰۰۰</Button>
                <Button variant="outline" onClick={() => setAmount('100000')}>۱۰۰,۰۰۰</Button>
                <Button variant="outline" onClick={() => setAmount('200000')}>۲۰۰,۰۰۰</Button>
                <Button variant="outline" onClick={() => setAmount('500000')}>۵۰۰,۰۰۰</Button>
              </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleNextStep}>
            ادامه و مشاهده اطلاعات پرداخت
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
  );
  
  const renderStepTwo = () => (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>۲. واریز وجه</CardTitle>
          <CardDescription>
            لطفاً مبلغ <span className="font-bold text-primary">{formatCurrency(Number(amount))}</span> را به شماره کارت زیر واریز نمایید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {randomAccount ? (
              <div key={randomAccount.id} className="p-4 border rounded-lg bg-muted flex flex-col gap-2">
                  <div className="flex justify-between">
                      <span>صاحب حساب:</span>
                      <span className="font-medium">{randomAccount.cardHolder}</span>
                  </div>
                   <div className="flex justify-between items-center">
                      <span>شماره کارت:</span>
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => copyToClipboard(randomAccount.cardNumber)}>
                         <span className="font-mono text-lg tracking-wider" dir="ltr">{randomAccount.cardNumber}</span>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                           <Copy className="h-4 w-4"/>
                         </Button>
                      </div>
                  </div>
              </div>
            ) : (financialSettings.accounts || []).length > 0 ? (
                 <div className="text-center text-muted-foreground p-4 border rounded-lg bg-muted">
                    در حال انتخاب حساب...
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-4 border rounded-lg bg-muted">
                    هیچ حساب بانکی توسط مدیر تنظیم نشده است. لطفاً با پشتیبانی تماس بگیرید.
                </div>
            )}
             <p className="text-xs text-muted-foreground">پس از واریز، روی دکمه "ادامه" کلیک کرده و اطلاعات رسید خود را وارد کنید.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
           <Button variant="outline" onClick={() => setStep(1)}>بازگشت</Button>
           <Button onClick={() => setStep(3)} disabled={!(financialSettings.accounts && financialSettings.accounts.length > 0)}>ادامه و ثبت رسید</Button>
        </CardFooter>
      </Card>
  );

  const renderStepThree = () => (
     <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>۳. ثبت اطلاعات رسید</CardTitle>
          <CardDescription>
            جزئیات پرداخت خود (مانند شماره پیگیری، تاریخ و ساعت) را در کادر زیر وارد کنید و دکمه ارسال را بزنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
                <p>مبلغ واریزی: <span className="font-bold">{formatCurrency(Number(amount))}</span></p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="receipt-details">جزئیات رسید</Label>
                <Textarea
                  id="receipt-details"
                  value={receiptDetails}
                  onChange={(e) => setReceiptDetails(e.target.value)}
                  placeholder="مثال: واریز از طریق اپلیکیشن بانک ملت، شماره پیگیری ۱۲۳۴۵۶ در تاریخ ۱۴۰۳/۰۵/۰۱ ساعت ۱۱:۳۰"
                  rows={5}
                />
             </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(2)}>بازگشت</Button>
          <Button onClick={handleFinalSubmit}>
            <Send className="ml-2 h-4 w-4" />
            ارسال و ثبت درخواست
          </Button>
        </CardFooter>
      </Card>
  );


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">افزایش موجودی کیف پول</h1>
          <p className="text-muted-foreground">
            موجودی حساب کاربری خود را برای خریدهای آینده افزایش دهید.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
          
           <Card>
                <CardHeader>
                    <CardTitle>موجودی فعلی</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-primary">
                        {formatCurrency(user?.walletBalance)}
                    </div>
                     <p className="text-sm text-muted-foreground mt-2">
                        این موجودی برای تمام خریدهای شما در پنل قابل استفاده است.
                     </p>
                </CardContent>
           </Card>
      </div>

    </div>
  );
}
