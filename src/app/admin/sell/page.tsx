'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Barcode, DollarSign, Loader2, PlusCircle, ScanLine, ShoppingCart, Trash2, X } from 'lucide-react';

import { BarcodeScanner } from '@/components/barcode-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { BarcodeProductLookupOutput } from '@/ai/flows/barcode-product-lookup';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ScannedItem = BarcodeProductLookupOutput & {
    scanId: number;
};

export default function SellPage() {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { toast } = useToast();

    const handleProductScanned = (product: BarcodeProductLookupOutput) => {
        setScannedItems(prevItems => [...prevItems, {...product, scanId: Date.now()}]);
        setIsScanning(false);
        toast({
            title: "Product Added",
            description: `${product.productName} has been added to the sale.`,
        });
    };

    const handleRemoveItem = (scanId: number) => {
        setScannedItems(prevItems => prevItems.filter(item => item.scanId !== scanId));
    };
    
    const handleCheckout = async () => {
        setIsCheckingOut(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsCheckingOut(false);
        setScannedItems([]);
        toast({
            title: "Sale Completed",
            description: "The transaction was successful.",
        });
    };

    const totalAmount = scannedItems.reduce((total, item) => total + item.price, 0);

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Point of Sale</CardTitle>
                        <CardDescription>
                            Scan products to add them to the current sale.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {scannedItems.length === 0 ? (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                                <ShoppingCart className="w-16 h-16 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No items in sale</h3>
                                <p className="mb-4">Click the button to start scanning.</p>
                             </div>
                        ) : (
                            <div className="space-y-4">
                                {scannedItems.map((item) => (
                                    <div key={item.scanId} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            width={48}
                                            height={48}
                                            className="rounded-md"
                                            data-ai-hint="scanned product"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                                        </div>
                                        <p className="font-semibold">${item.price.toFixed(2)}</p>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.scanId)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                     <CardFooter className="flex-col items-stretch gap-2">
                        <Button size="lg" onClick={() => setIsScanning(true)} disabled={isScanning}>
                            <ScanLine className="mr-2 h-5 w-5" />
                            {scannedItems.length > 0 ? 'Scan Another Product' : 'Start Scanning'}
                        </Button>
                        {scannedItems.length > 0 && (
                            <Button size="lg" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setShowConfirm(true)}>
                                <X className="mr-2 h-5 w-5" />
                                Cancel Sale
                            </Button>
                        )}
                     </CardFooter>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card className="sticky top-20">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <DollarSign className="w-6 h-6" />
                            Sale Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Items</span>
                                <span className="font-semibold">{scannedItems.length}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full bg-accent hover:bg-accent/90" 
                            size="lg" 
                            disabled={scannedItems.length === 0 || isCheckingOut}
                            onClick={handleCheckout}
                        >
                            {isCheckingOut ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <PlusCircle className="mr-2 h-5 w-5" />
                            )}
                            {isCheckingOut ? 'Processing...' : 'Complete Sale'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
        
        {isScanning && (
            <BarcodeScanner
                onScan={handleProductScanned}
                onClose={() => setIsScanning(false)}
            />
        )}
        
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will cancel the current sale and remove all scanned items. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Sale</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            setScannedItems([]);
                            setShowConfirm(false);
                            toast({ title: 'Sale Cancelled', variant: 'destructive' });
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Cancel Sale
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </>
    );
}
