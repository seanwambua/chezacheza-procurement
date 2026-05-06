
"use client";

import { useState, useEffect } from 'react';
import { generateVendorPerformanceSummary, VendorPerformanceOutput } from '@/ai/flows/generate-vendor-performance-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { Vendor } from '@/lib/types';

interface PerformanceSummaryProps {
  vendor: Vendor;
}

export function PerformanceSummary({ vendor }: PerformanceSummaryProps) {
  const [summary, setSummary] = useState<VendorPerformanceOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSummary() {
      try {
        const result = await generateVendorPerformanceSummary({
          vendorName: vendor.name,
          qualityRatings: [
            { itemId: 'IT-001', rating: Math.floor(vendor.rating), comment: 'Consistent quality' },
            { itemId: 'IT-002', rating: Math.max(1, Math.floor(vendor.rating - 1)), comment: 'Slight delay in support' },
          ],
          deliveryMetrics: {
            onTimeDeliveryRate: vendor.onTimeDeliveryRate,
            averageDeliveryTime: 5,
            totalOrders: 42,
          },
          disputeHistory: vendor.disputeCount > 0 ? [
            { disputeId: 'D-101', date: '2024-01-10', reason: 'Late delivery', resolution: 'Credit note issued' }
          ] : [],
        });
        setSummary(result);
      } catch (error) {
        console.error("AI Error:", error);
      } finally {
        setLoading(false);
      }
    }
    getSummary();
  }, [vendor]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 border border-dashed rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Analyzing vendor performance data with AI...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-accent">AI Performance Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium leading-relaxed">{summary.overallSummary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-none border-border">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <CardTitle className="text-sm">Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <ul className="space-y-1">
              {summary.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <CardTitle className="text-sm">Weaknesses</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <ul className="space-y-1">
              {summary.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <CardTitle className="text-sm">Improvement Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <ul className="space-y-1">
              {summary.areasForImprovement.map((a, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
