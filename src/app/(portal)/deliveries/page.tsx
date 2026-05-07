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
  Eye, 
  ClipboardCheck, 
  History,
  AlertCircle,
  FileText,
  Star
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { CycleTimer } from '@/components/procurement/CycleTimer';
import { GRN } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function DeliveriesPage() {
  const { grns, lpos, selectedYear } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  const filteredGrns = (grns || []).filter(grn => 
    grn.fiscalYear === selectedYear &&
    (grn.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    grn.receivedBy.toLowerCase().includes(search.toLowerCase()))
  );

  const activeDisputes = filteredGrns.filter(g => g.disputeFlag && g.disputeStatus !== 'Resolved').length;
  const qualityRate = filteredGrns.length > 0 
    ? Math.round((filteredGrns.filter(g => !g.disputeFlag).length / filteredGrns.length) * 100) 
    : 100;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Fulfillment Ledger
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Verified goods receipts and delivery cycle tracking for FY {selectedYear}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Verified Receipts" 
          value={filteredGrns.length} 
          icon={Truck} 
          description={isDetailed ? "Completed fulfillment cycles" : undefined}
        />
        <StatCard 
          title="Active Disputes" 
          value={activeDisputes} 
          icon={AlertTriangle} 
          description={isDetailed ? "Awaiting resolution" : undefined}
          trend={activeDisputes > 0 ? { value: activeDisputes, isUp: false } : undefined}
        />
        <StatCard 
          title="Quality Standard" 
          value={`${qualityRate}%`} 
          icon={CheckCircle2} 
          description={isDetailed ? "First-time right delivery rate" : undefined}
        />
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b py-4 px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <CardTitle className="text-base font-headline font-bold">Verification History ({selectedYear})</CardTitle>
          </div>
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
                  {isDetailed && <TableHead className="w-[100px] font-bold uppercase text-[10px]">Reference</TableHead>}
                  <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">LPO Agreement</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Cycle Speed</TableHead>
                  {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Receiving Officer</TableHead>}
                  <TableHead className="font-bold uppercase text-[10px]">Quality Status</TableHead>
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
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-primary">{grn.lpoNumber}</span>
                            {isDetailed && <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">FY {grn.fiscalYear} Cycle</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {linkedLpo && (
                            <CycleTimer 
                              startTime={linkedLpo.dispatchedAt || linkedLpo.createdAt} 
                              endTime={grn.receivedDate} 
                            />
                          )}
                        </TableCell>
                        {isDetailed && <TableCell className="text-xs font-medium text-muted-foreground">{grn.receivedBy}</TableCell>}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={grn.disputeFlag ? 'destructive' : 'secondary'} className="text-[9px] uppercase px-1.5 h-4 font-black">
                              {grn.disputeFlag ? (grn.disputeStatus === 'Resolved' ? 'RESOLVED' : 'DISPUTED') : 'VERIFIED'}
                            </Badge>
                            {grn.disputeFlag && grn.disputeStatus !== 'Resolved' && (
                              <AlertCircle className="w-3.5 h-3.5 text-destructive animate-pulse" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] font-black uppercase shadow-sm gap-1.5"
                            onClick={() => setSelectedGrn(grn)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                        <Truck className="w-10 h-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">No fulfillment history for FY {selectedYear}.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* GRN Detail Dialog */}
      <Dialog open={!!selectedGrn} onOpenChange={(open) => !open && setSelectedGrn(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tight text-xl">
              <ClipboardCheck className="w-6 h-6 text-accent" />
              Goods Received Note: {selectedGrn?.id}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Official audit of received organizational assets for {selectedGrn?.lpoNumber}.
            </DialogDescription>
          </DialogHeader>

          {selectedGrn && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1">Received By</p>
                  <p className="text-sm font-bold text-primary">{selectedGrn.receivedBy}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">{new Date(selectedGrn.receivedDate).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1">Status</p>
                    <Badge variant={selectedGrn.disputeFlag ? 'destructive' : 'secondary'} className="text-[10px] font-black px-1.5 h-4.5 uppercase">
                      {selectedGrn.disputeFlag ? (selectedGrn.disputeStatus || 'Open Dispute') : 'Fully Verified'}
                    </Badge>
                  </div>
                  {selectedGrn.disputeFlag && (
                     <p className="text-[9px] text-destructive font-bold uppercase mt-2">Action Required: Strategic Settlement</p>
                  )}
                </div>
              </div>

              {selectedGrn.disputeFlag && selectedGrn.disputeReason && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <h4 className="text-[10px] font-black uppercase text-destructive tracking-widest">Reported Inconsistency</h4>
                  </div>
                  <p className="text-xs font-bold text-primary leading-relaxed italic">"{selectedGrn.disputeReason}"</p>
                  {selectedGrn.resolutionNotes && (
                    <div className="mt-4 pt-4 border-t border-destructive/10">
                      <p className="text-[9px] font-black uppercase text-accent tracking-widest mb-1">Resolution Audit</p>
                      <p className="text-xs font-medium text-muted-foreground">"{selectedGrn.resolutionNotes}"</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Line Item Audit</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{selectedGrn.items.length} Items Verified</p>
                </div>
                <div className="border rounded-xl divide-y bg-card shadow-sm overflow-hidden">
                  {selectedGrn.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-muted/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-primary truncate">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-black uppercase text-muted-foreground">Qty: {item.receivedQty} / {item.orderedQty}</span>
                          <span className={cn(
                            "text-[9px] font-black px-1.5 rounded uppercase",
                            item.condition === 'Good' ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                          )}>{item.condition}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-center">
                        <span className="text-[9px] font-black text-muted-foreground uppercase mr-1">Quality:</span>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star 
                            key={s} 
                            className={cn(
                              "w-3 h-3", 
                              s <= item.qualityRating ? "fill-accent text-accent" : "text-muted/30"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-6 border-t gap-2">
                <Button variant="outline" className="font-black uppercase text-xs h-10" onClick={() => setSelectedGrn(null)}>
                  Close Audit
                </Button>
                <Button className="bg-primary font-black uppercase text-xs h-10 shadow-lg gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Print PDF Certificate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
