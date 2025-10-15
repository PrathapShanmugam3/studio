import { Suspense } from 'react';
import { ProductForm } from '../components/product-form';

export default function NewProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm />
    </Suspense>
  );
}
