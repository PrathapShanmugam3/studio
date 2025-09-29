'use client';

import { CartProvider } from '@/context/cart-context';
import { Header } from '@/components/header';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </CartProvider>
  );
}
