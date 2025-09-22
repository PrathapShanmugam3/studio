'use client';

import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from './ui/sheet';
import { Separator } from './ui/separator';
import { Trash2, ShoppingCart } from 'lucide-react';
import { placeOrder } from '@/lib/actions';

export function Cart() {
  const { state, dispatch, totalPrice } = useCart();

  const handleQuantityChange = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };
  
  const handleCheckout = async () => {
    await placeOrder(state.items);
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
      <SheetHeader className="px-6">
        <SheetTitle className='font-headline'>Shopping Cart</SheetTitle>
      </SheetHeader>
      <Separator />
      {state.items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="h-20 w-20 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Your cart is empty</p>
            <SheetClose asChild>
                <Button>Continue Shopping</Button>
            </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 p-6">
              {state.items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                    data-ai-hint="product image"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                      className="h-8 w-16 text-center"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <SheetFooter className="p-6">
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center justify-between font-semibold">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Payment Method</span>
                <span>Cash on Delivery</span>
              </div>
              <form action={handleCheckout} className="w-full">
                <SheetClose asChild>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                    Proceed to Checkout
                  </Button>
                </SheetClose>
              </form>
            </div>
          </SheetFooter>
        </>
      )}
    </SheetContent>
  );
}
