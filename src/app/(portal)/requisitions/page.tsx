"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RequisitionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new combined Orders hub
    router.replace('/lpos?tab=requisitions');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="animate-pulse space-y-4">
        <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Syncing Orders Hub...</h2>
        <p className="text-sm text-muted-foreground">Requisitions have been merged into the Orders management section.</p>
      </div>
    </div>
  );
}
