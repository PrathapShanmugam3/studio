import { products } from '@/lib/data';
import { ProductForm } from '../components/product-form';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const product = products.find(p => p.id === params.id);

  if (!product) {
    return <div>Product not found</div>;
  }

  return <ProductForm product={product} />;
}
