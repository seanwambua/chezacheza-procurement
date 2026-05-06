"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, Mail, UserPlus, Search, Users, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Vendor } from '@/lib/types';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function VendorsPage() {
  const { vendors } = useStore();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (vendors.length > 0 && !selectedVendor) {
      // Auto-select first vendor on desktop to avoid empty state
      if (window.innerWidth >= 1024) {
        setSelectedVendor(vendors[0]);
      }
    }
  }, [vendors]);

  if (!mounted) return null;

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Vendor Database
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Manage relationships and track vendor performance.</p>
        </div>
        <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 font-bold uppercase text-xs h-10 shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Onboard Vendor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-start">
        {/* Vendor List */}
        <div className={cn(
          "lg:col-span-1 space-y-4",
          selectedVendor && "hidden lg:block" // Hide list on mobile when detail is shown
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
            {filteredVendors.length === 0 && (
              <div className="text-center py-12 opacity-50 space-y-2">
                <Users className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-xs font-bold uppercase">No vendors found</p>
              </div>
            )}
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
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[9px] uppercase font-black px-1.5 h-4.5">
                        VERIFIED
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Performance History</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-none border-border/50 bg-muted/20">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
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
    </div>
  );
}
