import { ProductService } from '@/services/product-service';
import { ProductCard } from '@/components/product-card';

export default async function ProductsPage() {
  const products = await ProductService.getProducts();
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Fresh & Organic
          </h1>
          <p className="text-muted-foreground">
            Browse our selection of high-quality groceries.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
