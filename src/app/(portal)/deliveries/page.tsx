"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Truck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
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

export default function DeliveriesPage() {
  const { grns } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  const filteredGrns = grns.filter(grn => 
    grn.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    grn.receivedBy.toLowerCase().includes(search.toLowerCase())
  );

  const activeDisputes = grns.filter(g => g.disputeFlag).length;
  const qualityRate = grns.length > 0 
    ? Math.round((grns.filter(g => !g.disputeFlag).length / grns.length) * 100) 
    : 100;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Goods Received (GRN)
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Verify delivery quality and manage supplier disputes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Total Receipts" 
          value={grns.length} 
          icon={Truck} 
          description={isDetailed ? "Total verified deliveries" : undefined}
        />
        <StatCard 
          title="Active Disputes" 
          value={activeDisputes} 
          icon={AlertTriangle} 
          description={isDetailed ? "Quality or quantity issues" : undefined}
        />
        <div className="sm:col-span-2 md:col-span-1">
          <StatCard 
            title="Acceptance Rate" 
            value={`${qualityRate}%`} 
            icon={CheckCircle2} 
            description={isDetailed ? "Clean receipts vs total" : undefined}
          />
        </div>
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b py-4 px-4 sm:px-6 gap-4">
          <CardTitle className="text-base md:text-lg font-headline">Fulfillment History</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
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
                  <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Received By</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Quality Status</TableHead>
                  {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Received Date</TableHead>}
                  <TableHead className="text-right font-bold uppercase text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrns.length > 0 ? (
                  filteredGrns.map((grn) => (
                    <TableRow key={grn.id} className="group hover:bg-muted/5">
                      {isDetailed && <TableCell className="font-black text-primary text-[10px]">{grn.id}</TableCell>}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground opacity-70" />
                          <span className={cn(
                            "font-bold",
                            isDetailed ? "text-xs" : "text-sm text-primary"
                          )}>{grn.lpoNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium truncate max-w-[120px]">{grn.receivedBy}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={grn.disputeFlag ? 'destructive' : 'secondary'} 
                          className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter"
                        >
                          {grn.disputeFlag ? 'DISPUTED' : 'VERIFIED'}
                        </Badge>
                      </TableCell>
                      {isDetailed && (
                        <TableCell>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(grn.receivedDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight">
                          View PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                        <div className="p-4 bg-muted rounded-full">
                          <Truck className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">No goods received records found.</p>
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
