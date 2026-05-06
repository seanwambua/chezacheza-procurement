"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { CreditCard, Search, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const { lpos, grns, selectedYear } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  const paymentHistory = lpos
    .filter(lpo => lpo.fiscalYear === selectedYear && ['Fulfilled', 'Matched', 'Closed'].includes(lpo.status))
    .map(lpo => ({
      ...lpo,
      paymentStatus: lpo.status === 'Closed' ? 'Paid' : 'Pending Verification',
    }));

  const filteredPayments = paymentHistory.filter(p => 
    p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    p.lpoNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = paymentHistory.filter(p => p.paymentStatus === 'Paid').reduce((acc, p) => acc + p.totalValue, 0);
  const pendingPayments = paymentHistory.filter(p => p.paymentStatus !== 'Paid').reduce((acc, p) => acc + p.totalValue, 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn("font-headline font-bold text-primary tracking-tighter text-3xl md:text-4xl")}>
            Vendor Disbursements
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Settlements for FY {selectedYear}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Total Disbursed" value={`Ksh ${totalPaid.toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Pending Release" value={`Ksh ${pendingPayments.toLocaleString()}`} icon={Clock} />
        <StatCard title="Fiscal Disputes" value={grns.filter(g => g.fiscalYear === selectedYear && g.disputeFlag).length} icon={AlertCircle} />
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b py-4 px-4 sm:px-6 gap-4">
          <CardTitle className="text-base font-headline">Payment Register ({selectedYear})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search FY payments..." 
              className="w-full pl-9 h-10 text-xs bg-muted/30 border-none focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none">
                  {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>}
                  <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Beneficiary</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Value</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-muted/5">
                      {isDetailed && <TableCell className="font-black text-primary text-[10px]">{p.lpoNumber}</TableCell>}
                      <TableCell>
                        <span className="font-bold text-xs text-primary">{p.vendorName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.paymentStatus === 'Paid' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 h-4">
                          {p.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black tracking-tighter text-xs">
                        Ksh {p.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase">Advice</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 5 : 4} className="h-48 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No verified payment records for FY {selectedYear}.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}