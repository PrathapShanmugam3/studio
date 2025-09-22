"use client";

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  itemCount: number;
  totalPrice: number;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, items: updatedItems };
      }
      const newItem: CartItem = {
        id: action.payload.id,
        name: action.payload.name,
        price: action.payload.price,
        image: action.payload.image,
        quantity: 1,
      };
      return { ...state, items: [...state.items, newItem] };
    }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0);
      return { ...state, items: updatedItems };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { toast } = useToast();

  const enhancedDispatch = (action: CartAction) => {
    if (action.type === 'ADD_ITEM') {
      toast({
        title: "Added to cart!",
        description: `${action.payload.name} has been added to your cart.`,
      });
    }
    dispatch(action);
  };

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch: enhancedDispatch, itemCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
