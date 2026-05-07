"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Phone, 
  Mail, 
  UserPlus, 
  Search, 
  Users, 
  History, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  FileText,
  MessageSquareWarning,
  MessageCircle,
  ShieldAlert,
  Gavel,
  History as HistoryIcon,
  Send,
  ShieldCheck as VerifiedIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Vendor, GRN, VendorFeedback } from '@/lib/types';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const vendorSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  category: z.string().min(1, "Category is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone is required"),
  taxCompliant: z.boolean().refine(v => v === true, "Tax compliance is mandatory"),
  businessPermit: z.boolean().refine(v => v === true, "Valid permit is mandatory"),
  bankDetailsProvided: z.boolean().refine(v => v === true, "Bank details are required"),
  dataProtectionConsent: z.boolean().refine(v => v === true, "Data consent is required"),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function VendorsPage() {
  const store = useStore();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  
  const vendors = store.vendors || [];
  const grns = store.grns || [];
  const vendorFeedback = store.vendorFeedback || [];
  const selectedYear = store.selectedYear;
  const addVendor = store.addVendor;
  const resolveDispute = store.resolveDispute;
  const addFeedback = store.addFeedback;

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssuranceOpen, setIsAssuranceOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  // Assurance View States
  const [assuranceSearch, setAssuranceSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<GRN | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      category: '',
      email: '',
      phone: '',
      taxCompliant: false,
      businessPermit: false,
      bankDetailsProvided: false,
      dataProtectionConsent: false,
    },
  });

  useEffect(() => {
    setMounted(true);
    if (vendors.length > 0 && !selectedVendor) {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setSelectedVendor(vendors[0]);
      }
    }
  }, [vendors]);

  if (!mounted) return null;

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (values: VendorFormValues) => {
    const newVendor: Vendor = {
      id: `V-${Math.floor(Math.random() * 10000)}`,
      name: values.name,
      email: values.email,
      phone: values.phone,
      category: values.category,
      rating: 5.0,
      onTimeDeliveryRate: 100,
      disputeCount: 0,
      onboardingDate: new Date().toISOString().split('T')[0],
    };

    addVendor(newVendor);
    toast({
      title: "Vendor Onboarded",
      description: `${values.name} has been successfully added to the registry.`,
    });
    setIsDialogOpen(false);
    resetWizard();
  };

  const resetWizard = () => {
    setStep(1);
    form.reset();
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof VendorFormValues)[] = [];
    if (step === 1) fieldsToValidate = ['name', 'category', 'email', 'phone'];
    if (step === 2) fieldsToValidate = ['taxCompliant', 'businessPermit', 'bankDetailsProvided', 'dataProtectionConsent'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  // Assurance Logic
  const getAssuranceData = () => {
    const relevantGrns = selectedVendor 
      ? grns.filter(g => {
          const lpo = store.lpos.find(l => l.id === g.lpoId);
          return lpo?.vendorId === selectedVendor.id;
        })
      : grns;

    const relevantFeedback = selectedVendor
      ? vendorFeedback.filter(f => f.vendorId === selectedVendor.id)
      : vendorFeedback;

    const activeDisputes = relevantGrns.filter(g => g.disputeFlag && g.disputeStatus === 'Open' && g.fiscalYear === selectedYear);
    const resolvedDisputes = relevantGrns.filter(g => g.disputeFlag && g.disputeStatus === 'Resolved' && g.fiscalYear === selectedYear);
    
    const filteredFeedback = relevantFeedback.filter(f => 
      f.vendorName.toLowerCase().includes(assuranceSearch.toLowerCase()) ||
      f.comment.toLowerCase().includes(assuranceSearch.toLowerCase())
    );

    return { activeDisputes, resolvedDisputes, filteredFeedback };
  };

  const assuranceData = getAssuranceData();

  const handleResolveDispute = () => {
    if (!selectedDispute || !resolutionNotes) return;
    resolveDispute(selectedDispute.id, resolutionNotes);
    toast({ title: "Dispute Resolved" });
    setSelectedDispute(null);
    setResolutionNotes('');
  };

  const handleSubmitFeedback = () => {
    if (!selectedVendor || !feedbackComment) return;

    addFeedback({
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Vendor Database
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Manage relationships and track vendor performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Sheet open={isAssuranceOpen} onOpenChange={setIsAssuranceOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 font-bold uppercase text-[10px] shadow-sm">
                <MessageSquareWarning className="w-4 h-4 text-accent" />
                <span className="hidden sm:inline">Assurance & Feedback</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-2xl w-[95vw] overflow-y-auto flex flex-col h-full">
              <SheetHeader className="pb-6 border-b">
                <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                  Performance Assurance
                </SheetTitle>
                <SheetDescription className="text-xs font-medium">
                  {selectedVendor ? `Analyzing qualitative data for ${selectedVendor.name}.` : 'Global organizational fulfillment assurance.'}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 py-6">
                <Tabs defaultValue="active" className="w-full">
                  <div className="flex flex-col gap-4 mb-6">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                      <TabsTrigger value="active" className="text-[10px] font-black uppercase">Active ({assuranceData.activeDisputes.length})</TabsTrigger>
                      <TabsTrigger value="history" className="text-[10px] font-black uppercase">History</TabsTrigger>
                      <TabsTrigger value="feedback" className="text-[10px] font-black uppercase">Feedback</TabsTrigger>
                    </TabsList>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search assurance data..." 
                        className="pl-9 h-10 text-xs bg-card border-none shadow-sm"
                        value={assuranceSearch}
                        onChange={(e) => setAssuranceSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <TabsContent value="active" className="mt-0 focus-visible:ring-0">
                    <div className="space-y-4">
                      {assuranceData.activeDisputes.length > 0 ? (
                        assuranceData.activeDisputes.map((dispute) => (
                          <Card key={dispute.id} className="border-border shadow-none group bg-card">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/20">{dispute.lpoNumber}</Badge>
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
                        <div className="py-20 text-center opacity-30 italic text-xs">No active disputes detected.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-0 focus-visible:ring-0">
                     <div className="space-y-4">
                      {assuranceData.resolvedDisputes.length > 0 ? (
                        assuranceData.resolvedDisputes.map((dispute) => (
                          <Card key={dispute.id} className="border-border shadow-none opacity-80 bg-card">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <Badge variant="secondary" className="text-[10px] font-black uppercase">{dispute.lpoNumber}</Badge>
                                <span className="text-[9px] font-black uppercase text-muted-foreground">
                                  {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <p className="text-xs font-medium italic">"{dispute.resolutionNotes}"</p>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="py-20 text-center opacity-30 italic text-xs">No resolution records found.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="feedback" className="mt-0 focus-visible:ring-0">
                    <div className="space-y-4">
                      {selectedVendor && (
                        <Button 
                          className="w-full bg-accent text-white font-black uppercase text-[10px] h-10 shadow-sm"
                          onClick={() => setIsFeedbackDialogOpen(true)}
                        >
                          <Star className="w-3.5 h-3.5 mr-2" />
                          Post Qualitative Feedback
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 pt-4">
                        {assuranceData.filteredFeedback.length > 0 ? (
                          assuranceData.filteredFeedback.map((f) => (
                            <Card key={f.id} className="border-border shadow-none bg-card overflow-hidden">
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
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="py-20 text-center opacity-30 italic text-xs">No peer feedback recorded.</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <SheetFooter className="pt-6 border-t">
                <Button variant="outline" onClick={() => setIsAssuranceOpen(false)} className="w-full font-black uppercase text-xs h-11">Close Assurance View</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetWizard();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold uppercase text-xs h-10 shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Onboard Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">Onboarding Wizard</DialogTitle>
                <DialogDescription className="text-xs font-medium">
                  Step {step} of 3: {step === 1 ? 'Business Identity' : step === 2 ? 'KYC & Compliance' : 'Review & Finalize'}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                        step === s ? "bg-accent text-white scale-110 shadow-lg" : 
                        step > s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                      </div>
                      {s < 3 && <div className={cn("flex-1 h-0.5 rounded-full", step > s ? "bg-primary" : "bg-muted")} />}
                    </div>
                  ))}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {step === 1 && (
                      <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Legal Company Name</FormLabel><FormControl><Input placeholder="e.g. Acme Supplies Ltd" {...field} className="h-10 text-xs" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Vendor Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select Industry" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {['IT Hardware', 'Stationery', 'Furniture', 'Logistics', 'Cleaning Services', 'Marketing'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Contact Email</FormLabel><FormControl><Input type="email" placeholder="sales@acme.com" {...field} className="h-10 text-xs" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Direct Phone</FormLabel><FormControl><Input placeholder="+254..." {...field} className="h-10 text-xs" /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-4">
                          <div className="flex items-center gap-2 text-primary mb-2">
                            <ShieldCheck className="w-5 h-5 text-accent" />
                            <h4 className="text-xs font-black uppercase tracking-tight">Compliance Checklist</h4>
                          </div>
                          <FormField control={form.control} name="taxCompliant" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs font-bold">Tax Compliance Verified</FormLabel>
                                <FormDescription className="text-[10px]">Confirm KRA compliance status is active.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="businessPermit" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs font-bold">Valid Business Permit</FormLabel>
                                <FormDescription className="text-[10px]">County business operations permit uploaded.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="bankDetailsProvided" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs font-bold">Bank Disbursement Details</FormLabel>
                                <FormDescription className="text-[10px]">Verified EFT/Mobile money details provided.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                          <Separator />
                          <FormField control={form.control} name="dataProtectionConsent" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 bg-accent/5 rounded-lg">
                              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-xs font-black text-accent uppercase">Data Protection Agreement</FormLabel>
                                <FormDescription className="text-[10px]">I agree to the processing of vendor data for procurement and audit purposes.</FormDescription>
                              </div>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                         <div className="p-6 bg-muted/30 border border-border/50 rounded-xl space-y-4">
                            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xl">
                                {form.getValues().name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-primary">{form.getValues().name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">{form.getValues().category}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                                <p className="text-xs font-medium truncate">{form.getValues().email}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Phone</p>
                                <p className="text-xs font-medium">{form.getValues().phone}</p>
                              </div>
                            </div>
                            <div className="pt-2">
                              <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase">Vetting & Data Consent Met</span>
                              </div>
                            </div>
                         </div>
                      </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-6 flex-col sm:flex-row border-t">
                      {step > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto font-bold uppercase text-xs h-10">
                          <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                          Previous
                        </Button>
                      )}
                      <div className="flex-1" />
                      {step < 3 ? (
                        <Button type="button" onClick={nextStep} className="w-full sm:w-auto bg-primary font-bold uppercase text-xs h-10 shadow-md">
                          Continue
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                      ) : (
                        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold uppercase text-xs h-10 shadow-md">
                          Authorize Onboarding
                        </Button>
                      )}
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-start">
        {/* Vendor List */}
        <div className={cn(
          "lg:col-span-1 space-y-4",
          selectedVendor && "hidden lg:block"
        )}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search vendors..." 
              className="w-full pl-9 h-10 text-xs bg-card border-none shadow-sm" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredVendors.map((vendor) => (
              <Card 
                key={vendor.id} 
                className={cn(
                  "shadow-none cursor-pointer transition-all border group bg-card",
                  selectedVendor?.id === vendor.id 
                    ? "border-accent ring-1 ring-accent bg-accent/[0.03]" 
                    : "border-border hover:border-accent/50"
                )}
                onClick={() => setSelectedVendor(vendor)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-bold text-sm truncate text-primary">{vendor.name}</h4>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter px-1.5 py-0 h-4 shrink-0">
                      {vendor.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-accent fill-accent" />
                      <span className="text-foreground">{vendor.rating}</span>
                    </div>
                    <span className="opacity-30">•</span>
                    <span className="uppercase tracking-tight">{vendor.onTimeDeliveryRate}% On-time</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Vendor Detail */}
        <div className={cn(
          "lg:col-span-3",
          !selectedVendor && "hidden lg:block"
        )}>
          {selectedVendor ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-card p-4 sm:p-8 rounded-2xl border border-border shadow-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden mb-6 h-8 text-[10px] font-black uppercase tracking-widest text-accent"
                  onClick={() => setSelectedVendor(null)}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Back to Database
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-muted flex items-center justify-center text-xl sm:text-3xl font-black text-primary shrink-0 shadow-inner">
                      {selectedVendor.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-primary tracking-tighter truncate leading-tight">
                        {selectedVendor.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter px-2 h-5">
                          {selectedVendor.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase opacity-70">Joined: {selectedVendor.onboardingDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-tight shadow-sm">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-accent" /> Email
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-tight shadow-sm">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-accent" /> Call
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 py-6 border-y border-border/50">
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Quality Rating</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xl sm:text-2xl font-black tracking-tighter">{selectedVendor.rating}</p>
                      <Star className="w-4 h-4 text-accent fill-accent mb-1" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">On-Time Rate</p>
                    <p className="text-xl sm:text-2xl font-black tracking-tighter">{selectedVendor.onTimeDeliveryRate}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Disputes</p>
                    <p className={cn(
                      "text-xl sm:text-2xl font-black tracking-tighter",
                      selectedVendor.disputeCount > 3 ? "text-destructive" : "text-primary"
                    )}>
                      {selectedVendor.disputeCount}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Compliance</p>
                    <div className="pt-1">
                      <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 text-[9px] uppercase font-black px-1.5 h-4.5">
                        VERIFIED
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-accent" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary">Performance History</h4>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-2 text-[10px] font-black uppercase text-accent hover:bg-accent/10"
                      onClick={() => setIsAssuranceOpen(true)}
                    >
                      <MessageSquareWarning className="w-3.5 h-3.5" />
                      Assurance Feed
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-none border-border/50 bg-muted/20">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Success Rate</p>
                          <p className="text-sm font-bold text-primary truncate">High reliability across all orders</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border-border/50 bg-muted/20">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Alerts</p>
                          <p className="text-sm font-bold text-primary truncate">
                            {selectedVendor.disputeCount === 0 ? 'Zero active disputes' : `${selectedVendor.disputeCount} resolved issues`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-2xl border-border/50 bg-muted/5">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-black text-primary tracking-tight">Select a Partner</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2 font-medium">
                Choose a vendor from the directory to view detailed fiscal analytics and delivery compliance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Internal Dispute Resolution Dialog */}
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

      {/* Internal Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">Post Peer Feedback</DialogTitle>
            <DialogDescription className="text-xs">Share experience about {selectedVendor?.name}.</DialogDescription>
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
