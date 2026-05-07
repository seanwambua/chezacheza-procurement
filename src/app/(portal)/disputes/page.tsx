"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MovedDisputesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vendors');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="animate-pulse space-y-4">
        <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Redirecting...</h2>
        <p className="text-sm text-muted-foreground">Disputes and Feedback have been moved to the Vendor section.</p>
      </div>
    </div>
  );
}
