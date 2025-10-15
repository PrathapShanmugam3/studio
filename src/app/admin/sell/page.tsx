
import { Suspense } from 'react';
import SellPageClient from './components/sell-page-client';
import { Skeleton } from '@/components/ui/skeleton';

function SellPageSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Skeleton className="h-[400px] w-full" />
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-[250px] w-full" />
            </div>
        </div>
    );
}

export default function SellPage() {
    return (
        <Suspense fallback={<SellPageSkeleton />}>
            <SellPageClient />
        </Suspense>
    );
}
