"use client";

import { useState } from 'react';
import { 
  Star, 
  Search, 
  MessageSquareWarning, 
  CheckCircle2, 
  Gavel, 
  History as HistoryIcon,
  Send,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Vendor, GRN } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VendorAssuranceProps {
  vendor: Vendor;
}

export function VendorAssurance({ vendor }: VendorAssuranceProps) {
  const { grns, vendorFeedback, selectedYear, resolveDispute, addFeedback, lpos } = useStore();
  const { currentUser } = useUserStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<GRN | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Data Filtering
  const relevantGrns = grns.filter(g => {
    const lpo = lpos.find(l => l.id === g.lpoId);
    return lpo?.vendorId === vendor.id;
  });

  const relevantFeedback = vendorFeedback.filter(f => f.vendorId === vendor.id);

  const activeDisputes = relevantGrns.filter(g => g.disputeFlag && g.disputeStatus === 'Open' && g.fiscalYear === selectedYear);
  const resolvedDisputes = relevantGrns.filter(g => g.disputeFlag && g.disputeStatus === 'Resolved' && g.fiscalYear === selectedYear);
  
  const filteredFeedback = relevantFeedback.filter(f => 
    f.authorName.toLowerCase().includes(search.toLowerCase()) ||
    f.comment.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolveDispute = () => {
    if (!selectedDispute || !resolutionNotes) return;
    resolveDispute(selectedDispute.id, resolutionNotes);
    toast({ title: "Dispute Resolved" });
    setSelectedDispute(null);
    setResolutionNotes('');
  };

  const handleSubmitFeedback = () => {
    if (!feedbackComment) return;

    addFeedback({
      vendorId: vendor.id,
      vendorName: vendor.name,
      authorName: currentUser?.name || 'Unknown User',
      rating: feedbackRating,
      comment: feedbackComment
    });

    toast({ title: "Feedback Published" });
    setIsFeedbackDialogOpen(false);
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <h4 className="text-sm font-black uppercase tracking-widest text-primary">Performance Assurance</h4>
        </div>
        <div className="relative w-48 hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search assurance..." 
            className="pl-8 h-8 text-[10px] bg-muted/30 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 mb-6">
          <TabsTrigger value="active" className="text-[10px] font-black uppercase">
            Active Disputes ({activeDisputes.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] font-black uppercase">
            Resolution Logs
          </TabsTrigger>
          <TabsTrigger value="feedback" className="text-[10px] font-black uppercase">
            Peer Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
          <div className="space-y-4">
            {activeDisputes.length > 0 ? (
              activeDisputes.map((dispute) => (
                <Card key={dispute.id} className="border-border shadow-none group bg-muted/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/20 bg-background">{dispute.lpoNumber}</Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[9px] font-black uppercase text-accent border-accent/20 hover:bg-accent hover:text-white"
                        onClick={() => setSelectedDispute(dispute)}
                      >
                        <Gavel className="w-3 h-3 mr-1.5" />
                        Resolve
                      </Button>
                    </div>
                    <p className="text-xs font-medium text-destructive leading-relaxed">{dispute.disputeReason}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Reported by {dispute.receivedBy}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center opacity-30 italic text-xs border-2 border-dashed rounded-xl">No active disputes detected.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
          <div className="space-y-4">
            {resolvedDisputes.length > 0 ? (
              resolvedDisputes.map((dispute) => (
                <Card key={dispute.id} className="border-border shadow-none opacity-80 bg-muted/10">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-[10px] font-black uppercase">{dispute.lpoNumber}</Badge>
                      <span className="text-[9px] font-black uppercase text-muted-foreground">
                        {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs font-medium italic text-primary">"{dispute.resolutionNotes}"</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center opacity-30 italic text-xs border-2 border-dashed rounded-xl">No resolution records found.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
          <div className="space-y-4">
            <Button 
              className="w-full bg-accent text-white font-black uppercase text-[10px] h-10 shadow-sm"
              onClick={() => setIsFeedbackDialogOpen(true)}
            >
              <Star className="w-3.5 h-3.5 mr-2" />
              Post Qualitative Feedback
            </Button>
            
            <div className="grid grid-cols-1 gap-4">
              {filteredFeedback.length > 0 ? (
                filteredFeedback.map((f) => (
                  <Card key={f.id} className="border-border shadow-none bg-muted/20 overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/50 bg-background/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xs font-black text-primary">{f.authorName}</CardTitle>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-xs font-black">{f.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-xs leading-relaxed font-medium italic text-muted-foreground">"{f.comment}"</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-12 text-center opacity-30 italic text-xs border-2 border-dashed rounded-xl">No peer feedback recorded.</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dispute Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Gavel className="w-6 h-6 text-accent" />
              Resolve Dispute
            </DialogTitle>
            <DialogDescription className="text-xs">
              Settle fulfillment issue for {selectedDispute?.lpoNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-1">Reported Issue</p>
              <p className="text-xs font-bold leading-relaxed">{selectedDispute?.disputeReason}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Resolution Notes</label>
              <Textarea 
                placeholder="Describe how this issue was settled..." 
                className="min-h-[100px] text-xs"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-6">
            <Button variant="outline" onClick={() => setSelectedDispute(null)} className="font-bold uppercase text-[10px] h-10">Cancel</Button>
            <Button className="bg-primary font-bold uppercase text-[10px] h-10 shadow-md" onClick={handleResolveDispute} disabled={!resolutionNotes}>Confirm Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Submission Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">Post Peer Feedback</DialogTitle>
            <DialogDescription className="text-xs">Share qualitative experience about {vendor.name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
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
                placeholder="Share your experience..." 
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
              disabled={!feedbackComment}
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
