import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CheckoutPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
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
    </div>
  );
}
