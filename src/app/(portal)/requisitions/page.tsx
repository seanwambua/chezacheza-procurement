
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';

export default function RequisitionsPage() {
  const { prs, budgetLines, addPR } = useStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('');
  const [budgetLine, setBudgetLine] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredPrs = prs.filter(pr => 
    pr.itemDescription.toLowerCase().includes(search.toLowerCase()) || 
    pr.refNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    addPR({
      itemDescription: description,
      quantity: parseInt(quantity),
      estimatedCost: parseFloat(cost),
      budgetLine: budgetLine,
      requesterName: 'Jane Doe',
      status: 'Pending Manager',
    });
    setIsDialogOpen(false);
    // Reset form
    setDescription('');
    setQuantity('1');
    setCost('');
    setBudgetLine('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-bold text-primary">Purchase Requisitions</h2>
          <p className="text-muted-foreground">Manage and track internal purchase requests.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit New PR</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="desc">Item Description</Label>
                <Input 
                  id="desc" 
                  placeholder="e.g. 10x Office Keyboards" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input 
                  id="qty" 
                  type="number" 
                  placeholder="1" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Estimated Unit Cost (Ksh)</Label>
                <Input 
                  id="cost" 
                  type="number" 
                  placeholder="0.00" 
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="budget">Budget Line</Label>
                <Select onValueChange={setBudgetLine} value={budgetLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget line" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetLines.map(bl => (
                      <SelectItem key={bl.id} value={bl.name}>{bl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit for Approval</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by description or REF#" 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>REF Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Budget Line</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Est. Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrs.map((pr) => (
              <TableRow key={pr.id} className="cursor-pointer hover:bg-muted/30">
                <TableCell className="font-medium">{pr.refNumber}</TableCell>
                <TableCell>{pr.itemDescription}</TableCell>
                <TableCell>{pr.requesterName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{pr.budgetLine}</TableCell>
                <TableCell>
                  <Badge variant={
                    pr.status === 'Approved' ? 'secondary' : 
                    pr.status === 'Rejected' ? 'destructive' : 'outline'
                  }>
                    {pr.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">Ksh {(pr.estimatedCost * pr.quantity).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
