"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  MessageSquareWarning, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  History, 
  Send, 
  Search,
  MessageCircle,
  ShieldAlert,
  Gavel
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GRN, VendorFeedback } from '@/lib/types';

export default function DisputesPage() {
  const store = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  
  // Robustly extract store values with fallbacks
  const grns = store.grns || [];
  const vendors = store.vendors || [];
  const vendorFeedback = store.vendorFeedback || [];
  const selectedYear = store.selectedYear;
  const resolveDispute = store.resolveDispute;
  const addFeedback = store.addFeedback;

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  
  const [selectedDispute, setSelectedDispute] = useState<GRN | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackVendorId, setFeedbackVendorId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  const activeDisputes = grns.filter(g => g.disputeFlag && g.disputeStatus === 'Open' && g.fiscalYear === selectedYear);
  const resolvedDisputes = grns.filter(g => g.disputeFlag && g.disputeStatus === 'Resolved' && g.fiscalYear === selectedYear);
  
  const filteredFeedback = vendorFeedback.filter(f => 
    f.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    f.comment.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolve = () => {
    if (!selectedDispute || !resolutionNotes) return;
    resolveDispute(selectedDispute.id, resolutionNotes);
    toast({
      title: "Dispute Resolved",
      description: "Fulfillment record updated and archived.",
    });
    setSelectedDispute(null);
    setResolutionNotes('');
  };

  const handleSubmitFeedback = () => {
    const vendor = vendors.find(v => v.id === feedbackVendorId);
    if (!vendor || !feedbackComment) return;

    addFeedback({
      vendorId: feedbackVendorId,
      vendorName: vendor.name,
      authorName: currentUser.name,
      rating: feedbackRating,
      comment: feedbackComment
    });

    toast({ title: "Feedback Published" });
    setIsFeedbackDialogOpen(false);
    setFeedbackVendorId('');
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Fulfillment Assurance
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Managing disputes and qualitative performance for FY {selectedYear}.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            className="bg-accent text-white font-bold uppercase text-[10px] h-9 shadow-md"
            onClick={() => setIsFeedbackDialogOpen(true)}
          >
            <Star className="w-3.5 h-3.5 mr-2" />
            Post Feedback
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Open Disputes" value={activeDisputes.length} icon={ShieldAlert} />
        <StatCard title="Resolved (FY)" value={resolvedDisputes.length} icon={CheckCircle2} />
        <StatCard title="Global Rating" value="4.2 / 5" icon={Star} />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full lg:w-[480px] grid-cols-3 bg-muted/50 p-1">
            <TabsTrigger value="active" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-tight">
              <MessageSquareWarning className="w-3.5 h-3.5" />
              Active Queue ({activeDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-tight">
              <History className="w-3.5 h-3.5" />
              Resolution Log
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-tight">
              <MessageCircle className="w-3.5 h-3.5" />
              Feedback Feed
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              className="pl-9 h-10 text-xs bg-card border-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="active" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-none overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none">
                  <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>
                  <TableHead className="min-w-[200px] font-bold uppercase text-[10px]">Dispute Reason</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Reporter</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDisputes.length > 0 ? (
                  activeDisputes.map((dispute) => (
                    <TableRow key={dispute.id} className="group hover:bg-muted/5">
                      <TableCell className="font-black text-primary text-xs">{dispute.lpoNumber}</TableCell>
                      <TableCell>
                        <p className="text-xs font-medium text-destructive truncate max-w-[300px]">{dispute.disputeReason}</p>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">{dispute.receivedBy}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 font-black uppercase text-[10px] shadow-sm text-accent border-accent/20 hover:bg-accent hover:text-white"
                          onClick={() => setSelectedDispute(dispute)}
                        >
                          <Gavel className="w-3.5 h-3.5 mr-1.5" />
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                       <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                        <div className="p-4 bg-muted rounded-full">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">All fulfillment records are currently verified.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-none overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none">
                  <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>
                  <TableHead className="min-w-[200px] font-bold uppercase text-[10px]">Resolution</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Resolved By</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedDisputes.length > 0 ? (
                  resolvedDisputes.map((dispute) => (
                    <TableRow key={dispute.id} className="group hover:bg-muted/5 opacity-80">
                      <TableCell className="font-black text-primary text-xs">{dispute.lpoNumber}</TableCell>
                      <TableCell>
                        <p className="text-xs font-medium truncate max-w-[300px]">{dispute.resolutionNotes}</p>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">System Admin</TableCell>
                      <TableCell className="text-right text-[10px] font-black uppercase whitespace-nowrap">
                        {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic">
                      No historical resolution records found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-0 focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((f) => (
                <Card key={f.id} className="border-border shadow-none hover:border-accent/30 transition-all bg-card overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-black text-primary">{f.vendorName}</CardTitle>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">By {f.authorName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span className="text-xs font-black">{f.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-xs leading-relaxed font-medium italic text-muted-foreground">"{f.comment}"</p>
                    <p className="text-[8px] text-muted-foreground/50 uppercase font-black mt-4 text-right">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full h-48 flex items-center justify-center border-2 border-dashed rounded-2xl text-muted-foreground opacity-50 italic">
                No qualitative feedback matching your criteria.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Gavel className="w-6 h-6 text-accent" />
              Resolve Dispute
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review verification issue for <strong>{selectedDispute?.lpoNumber}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
              <p className="text-[10px] uppercase font-black text-destructive tracking-widest">Reported Issue</p>
              <p className="text-xs font-bold leading-relaxed">{selectedDispute?.disputeReason}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Resolution Notes</label>
              <Textarea 
                placeholder="Explain how this issue was settled with the vendor..." 
                className="min-h-[120px] text-xs font-medium"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-6 border-t flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setSelectedDispute(null)} className="w-full sm:w-auto font-black uppercase text-[10px] h-10">Cancel</Button>
            <Button 
              className="w-full sm:w-auto bg-primary text-white font-black uppercase text-[10px] h-10 shadow-lg"
              onClick={handleResolve}
              disabled={!resolutionNotes}
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">Post Vendor Feedback</DialogTitle>
            <DialogDescription className="text-xs">Share qualitative insights about a professional partner.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground">Select Partner</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-accent outline-none"
                value={feedbackVendorId}
                onChange={(e) => setFeedbackVendorId(e.target.value)}
              >
                <option value="">Choose a Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground">Quality Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button 
                    key={r}
                    type="button"
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all border",
                      feedbackRating === r ? "bg-accent border-accent text-white scale-110 shadow-md" : "bg-muted border-transparent hover:bg-muted/80"
                    )}
                    onClick={() => setFeedbackRating(r)}
                  >
                    <Star className={cn("w-4 h-4", feedbackRating >= r ? "fill-current" : "")} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground">Testimonial / Comment</label>
              <Textarea 
                placeholder="Share your experience with this vendor..." 
                className="min-h-[100px] text-xs font-medium"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-6 border-t flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)} className="w-full sm:w-auto font-black uppercase text-[10px] h-10">Discard</Button>
            <Button 
              className="w-full sm:w-auto bg-accent text-white font-black uppercase text-[10px] h-10 shadow-lg"
              onClick={handleSubmitFeedback}
              disabled={!feedbackVendorId || !feedbackComment}
            >
              <Send className="w-3 h-3 mr-2" />
              Publish Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
