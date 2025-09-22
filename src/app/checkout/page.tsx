import Link from 'next/link';
import { CheckCircle2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function SimpleHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/products" className="flex items-center gap-2">
                    <Leaf className="h-7 w-7 text-primary" />
                    <span className="font-headline text-2xl font-bold text-primary">
                    Thirumalai Maligai
                    </span>
                </Link>
            </div>
        </header>
    );
}


export default function CheckoutPage() {
  return (
    <div className='flex flex-col min-h-screen'>
    <SimpleHeader />
    <main className="flex-grow flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="mt-4 font-headline text-2xl">Order Placed Successfully!</CardTitle>
                <CardDescription>
                    Thank you for your purchase. Your order will be prepared and delivered via cash on delivery.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-6 text-sm text-muted-foreground">
                    You can view your order details in your account page. For any questions, please contact our support team.
                </p>
                <Button asChild>
                    <Link href="/products">Continue Shopping</Link>
                </Button>
            </CardContent>
        </Card>
    </main>
    </div>
  );
}
