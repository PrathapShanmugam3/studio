'use client';

import { BarcodeScanner } from '@/components/barcode-scanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ScanPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Scan Barcode</CardTitle>
                <CardDescription>
                    Use the scanner to add new products from their barcodes.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <BarcodeScanner />
            </CardContent>
        </Card>
    );
}
