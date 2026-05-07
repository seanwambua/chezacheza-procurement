"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { Truck, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CycleTimer } from '@/components/procurement/CycleTimer';
import { cn } from '@/lib/utils';

export default function DeliveriesPage() {
  const { grns, lpos, selectedYear } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  const filteredGrns = grns.filter(grn => 
    grn.fiscalYear === selectedYear &&
    (grn.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    grn.receivedBy.toLowerCase().includes(search.toLowerCase()))
  );

  const activeDisputes = filteredGrns.filter(g => g.disputeFlag).length;
  const qualityRate = filteredGrns.length > 0 
    ? Math.round((filteredGrns.filter(g => !g.disputeFlag).length / filteredGrns.length) * 100) 
    : 100;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn("font-headline font-bold text-primary tracking-tighter text-3xl md:text-4xl")}>
            Goods Received (GRN)
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Deliveries for FY {selectedYear}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="FY Receipts" value={filteredGrns.length} icon={Truck} />
        <StatCard title="Active Disputes" value={activeDisputes} icon={AlertTriangle} />
        <StatCard title="Acceptance Rate" value={`${qualityRate}%`} icon={CheckCircle2} />
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b py-4 px-4 sm:px-6 gap-4">
          <CardTitle className="text-base font-headline">Fulfillment History ({selectedYear})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search receipts..." 
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
                  {isDetailed && <TableHead className="w-[100px] font-bold uppercase text-[10px]">GRN ID</TableHead>}
                  <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">LPO Reference</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Cycle Time</TableHead>
                  <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Received By</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrns.length > 0 ? (
                  filteredGrns.map((grn) => {
                    const linkedLpo = lpos.find(l => l.id === grn.lpoId);
                    return (
                      <TableRow key={grn.id} className="group hover:bg-muted/5">
                        {isDetailed && <TableCell className="font-black text-primary text-[10px]">{grn.id}</TableCell>}
                        <TableCell>
                          <span className="font-bold text-xs text-primary">{grn.lpoNumber}</span>
                        </TableCell>
                        <TableCell>
                          {linkedLpo && (
                            <CycleTimer 
                              startTime={linkedLpo.createdAt} 
                              endTime={grn.receivedDate} 
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{grn.receivedBy}</TableCell>
                        <TableCell>
                          <Badge variant={grn.disputeFlag ? 'destructive' : 'secondary'} className="text-[9px] uppercase px-1.5 h-4">
                            {grn.disputeFlag ? 'DISPUTED' : 'VERIFIED'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase">View PDF</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 6 : 5} className="h-48 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No receipts for FY {selectedYear}.</p>
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
