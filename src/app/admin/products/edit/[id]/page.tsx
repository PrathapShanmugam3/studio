import { ProductForm } from '@/app/admin/products/components/product-form';
import { ProductService } from '@/services/product-service';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await ProductService.getProductById(params.id);

  if (!product) {
    return <div>Product not found</div>;
  }

  return <ProductForm product={product} />;
}
