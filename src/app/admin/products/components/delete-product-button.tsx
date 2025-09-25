'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteProduct } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function DeleteProductButton({ productId }: { productId: string }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteProduct(productId);
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      // The revalidation is handled by the server action, but we need to tell Next.js to refresh the data
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsConfirmOpen(false);
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setIsConfirmOpen(true);
        }}
        className="text-destructive focus:bg-destructive/10"
      >
        Delete
      </DropdownMenuItem>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
