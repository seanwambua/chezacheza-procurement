"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const { lpos, grns } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  // Mocking payment status for visualization as it's not in the base schema yet
  const paymentHistory = lpos.filter(lpo => ['Fulfilled', 'Matched', 'Closed'].includes(lpo.status)).map(lpo => ({
    ...lpo,
    paymentStatus: lpo.status === 'Closed' ? 'Paid' : 'Pending Verification',
    paymentDate: lpo.status === 'Closed' ? new Date().toISOString() : null
  }));

  const filteredPayments = paymentHistory.filter(p => 
    p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    p.lpoNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = paymentHistory.filter(p => p.paymentStatus === 'Paid').reduce((acc, p) => acc + p.totalValue, 0);
  const pendingPayments = paymentHistory.filter(p => p.paymentStatus !== 'Paid').reduce((acc, p) => acc + p.totalValue, 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Vendor Disbursements
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Verified settlements and historical payment records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Total Disbursed" 
          value={`Ksh ${totalPaid.toLocaleString()}`} 
          icon={TrendingUp} 
          description={isDetailed ? "Verified successful payments" : undefined}
        />
        <StatCard 
          title="Pending Settlement" 
          value={`Ksh ${pendingPayments.toLocaleString()}`} 
          icon={Clock} 
          description={isDetailed ? "Awaiting finance release" : undefined}
        />
        <div className="sm:col-span-2 md:col-span-1">
          <StatCard 
            title="Active Disputes" 
            value={grns.filter(g => g.disputeFlag).length} 
            icon={AlertCircle} 
            description={isDetailed ? "Blocked for quality review" : undefined}
          />
        </div>
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b py-4 px-4 sm:px-6 gap-4">
          <CardTitle className="text-base md:text-lg font-headline">Payment History</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search payments..." 
              className="w-full pl-9 h-10 text-xs bg-muted/30 border-none shadow-none focus-visible:ring-1"
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
                  {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Terms</TableHead>}
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
                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "font-bold truncate",
                            isDetailed ? "text-xs" : "text-sm text-primary"
                          )}>{p.vendorName}</span>
                          {isDetailed && <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-70">LPO Matched</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={p.paymentStatus === 'Paid' ? 'secondary' : 'outline'} 
                          className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter"
                        >
                          {p.paymentStatus}
                        </Badge>
                      </TableCell>
                      {isDetailed && (
                        <TableCell>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold whitespace-nowrap">
                            <CreditCard className="w-3.5 h-3.5" />
                            {p.paymentTerms}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className={cn(
                        "text-right font-black tracking-tighter whitespace-nowrap",
                        isDetailed ? "text-xs" : "text-sm text-primary"
                      )}>
                        Ksh {p.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight">
                          Advice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                        <div className="p-4 bg-muted rounded-full">
                          <CreditCard className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">No verified payment records found.</p>
                      </div>
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
