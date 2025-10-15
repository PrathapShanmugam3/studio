'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { DollarSign, Loader2, PlusCircle, ScanLine, ShoppingCart, Trash2, X, Plus, Minus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
import { ProductService } from '@/services/product-service';
import type { Product, ScannedItem } from '@/lib/types';
import { ProductSelectionDialog } from './product-selection-dialog';


export default function SellPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [multipleProducts, setMultipleProducts] = useState<Product[]>([]);
    const { toast } = useToast();

    const handleBarcodeScanned = async (barcode: string) => {
        setIsLookingUp(true);

        toast({
            title: 'Barcode Scanned',
            description: `Looking up product for barcode: ${barcode}`,
        });

        try {
            const products = await ProductService.getProductsByBarcode(barcode);

            if (products.length === 0) {
                toast({
                    title: "Product Not Found",
                    description: "Could not find a product for the scanned barcode.",
                    variant: "destructive",
                });
            } else if (products.length === 1) {
                addProductToSale(products[0]);
            } else {
                setMultipleProducts(products);
            }
        } catch (error) {
            console.error("Product lookup failed:", error);
            toast({
                title: "Lookup Error",
                description: "An error occurred while looking up the product.",
                variant: "destructive",
            });
        } finally {
            setIsLookingUp(false);
        }
    };

    useEffect(() => {
        const scannedBarcode = searchParams.get('barcode');
        if (scannedBarcode && !isLookingUp) {
            alert(`Scanned Barcode: ${scannedBarcode}`);
            // Use URL API to safely remove the barcode parameter
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('barcode');
            window.history.replaceState({}, '', currentUrl.toString());

            handleBarcodeScanned(scannedBarcode);
        }
    }, [searchParams, isLookingUp]);


    const addProductToSale = (product: Product) => {
        setScannedItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
                (item) =>
                item.id === product.id &&
                item.barcode === product.barcode &&
                item.expiryDate === product.expiryDate
            );

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                const newQuantity = updatedItems[existingItemIndex].quantity + 1;
                if (newQuantity <= 100) {
                    updatedItems[existingItemIndex].quantity = newQuantity;
                    toast({
                        title: "Quantity Updated",
                        description: `${product.name} quantity increased to ${newQuantity}.`,
                    });
                } else {
                     toast({
                        title: "Quantity Limit",
                        description: `You cannot add more than 100 units of ${product.name}.`,
                        variant: 'destructive'
                    });
                }
                return updatedItems;
            } else {
                toast({
                    title: "Product Added",
                    description: `${product.name} has been added to the sale.`,
                });
                return [...prevItems, { ...product, quantity: 1 }];
            }
        });
    }

    const openExternalScanner = () => {
        // Create a clean URL without any existing search params for the return URL
        const returnUrl = encodeURIComponent(window.location.href.split('?')[0]);
        window.location.href = `microbizscanner://scan?returnUrl=${returnUrl}`;
    };


    const handleProductSelect = (product: Product) => {
        addProductToSale(product);
        setMultipleProducts([]);
    };

    const handleRemoveItem = (itemId: string) => {
        setScannedItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1 || newQuantity > 100) return;
        setScannedItems(prevItems => 
            prevItems.map(item => 
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
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

    const totalAmount = scannedItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);

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
                            {isLookingUp ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                                    <Loader2 className="w-16 h-16 mb-4 animate-spin" />
                                    <h3 className="text-xl font-semibold">Looking up product...</h3>
                                </div>
                            ) : scannedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                                    <ShoppingCart className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No items in sale</h3>
                                    <p className="mb-4">Click the button to start scanning.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {scannedItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                width={48}
                                                height={48}
                                                className="rounded-md object-cover"
                                                data-ai-hint="scanned product"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="font-bold text-center w-8">{item.quantity}</span>
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="font-semibold w-20 text-right">${((item.price || 0) * item.quantity).toFixed(2)}</p>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-2">
                            <Button size="lg" onClick={openExternalScanner} disabled={isLookingUp}>
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
                                    <span className="font-semibold">{scannedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
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
                                disabled={scannedItems.length === 0 || isCheckingOut || isLookingUp}
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

            <ProductSelectionDialog
                isOpen={multipleProducts.length > 0}
                products={multipleProducts}
                onSelect={handleProductSelect}
                onClose={() => setMultipleProducts([])}
            />

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
