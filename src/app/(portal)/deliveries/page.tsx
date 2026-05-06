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
  Building2,
  Calendar,
  Filter
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
import { GRN } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DeliveriesPage() {
  const { grns, lpos } = useStore();
  const { currentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const filteredGrns = grns.filter(grn => 
    grn.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    grn.receivedBy.toLowerCase().includes(search.toLowerCase())
  );

  const activeDisputes = grns.filter(g => g.disputeFlag).length;
  const qualityRate = grns.length > 0 
    ? Math.round((grns.filter(g => !g.disputeFlag).length / grns.length) * 100) 
    : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Goods Received (GRN)</h2>
          <p className="text-muted-foreground">Verify delivery quality and manage supplier disputes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Receipts" 
          value={grns.length} 
          icon={Truck} 
          description="Total verified deliveries"
        />
        <StatCard 
          title="Active Disputes" 
          value={activeDisputes} 
          icon={AlertTriangle} 
          description="Quality or quantity issues"
        />
        <StatCard 
          title="Acceptance Rate" 
          value={`${qualityRate}%`} 
          icon={CheckCircle2} 
          description="Clean receipts vs total"
        />
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4 px-6">
          <CardTitle className="text-lg font-headline">Fulfillment History</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by LPO# or Receiver..." 
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>GRN ID</TableHead>
                  <TableHead>LPO Reference</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Quality Status</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrns.length > 0 ? (
                  filteredGrns.map((grn) => (
                    <TableRow key={grn.id} className="group hover:bg-muted/5">
                      <TableCell className="font-bold text-primary">{grn.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{grn.lpoNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{grn.receivedBy}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={grn.disputeFlag ? 'destructive' : 'secondary'} 
                          className="text-[10px] px-2 py-0"
                        >
                          {grn.disputeFlag ? 'DISPUTED' : 'VERIFIED'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(grn.receivedDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">
                          View PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <p className="text-sm">No goods received records found.</p>
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
