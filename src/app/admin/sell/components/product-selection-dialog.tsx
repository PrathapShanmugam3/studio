
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/lib/types';

interface ProductSelectionDialogProps {
  isOpen: boolean;
  products: Product[];
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export function ProductSelectionDialog({
  isOpen,
  products,
  onSelect,
  onClose,
}: ProductSelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Multiple Products Found</DialogTitle>
          <DialogDescription>
            Please select the correct product from the list below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => onSelect(product)}
                >
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                        data-ai-hint="product image"
                    />
                    <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                    </div>
                     <Button variant="outline" size="sm">Select</Button>
                </div>
            ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
