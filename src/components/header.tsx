'use client';

import Link from 'next/link';
import { Leaf, ShoppingCart, UserCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { Button } from './ui/button';
import { Sheet, SheetTrigger } from './ui/sheet';
import { Cart } from './cart';

export function Header() {
  const { itemCount } = useCart();

  return (
    <Sheet>
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/products" className="flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-bold text-primary">
              Thirumalai Maligai
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block">
              Admin Panel
            </Link>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {itemCount}
                  </span>
                )}
                <span className="sr-only">Open cart</span>
              </Button>
            </SheetTrigger>
            <UserCircle className="h-7 w-7 text-muted-foreground" />
          </nav>
        </div>
      </header>
      <Cart />
    </Sheet>
  );
}
