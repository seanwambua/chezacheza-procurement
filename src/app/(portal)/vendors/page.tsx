
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, Mail, UserPlus, Search, Users, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Vendor } from '@/lib/types';
import { useStore } from '@/lib/store';

export default function VendorsPage() {
  const { vendors } = useStore();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-bold text-primary">Vendor Database</h2>
          <p className="text-muted-foreground">Manage relationships and track vendor performance.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Onboard Vendor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search vendors..." 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredVendors.map((vendor) => (
              <Card 
                key={vendor.id} 
                className={`shadow-none cursor-pointer transition-all border ${selectedVendor?.id === vendor.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:border-accent/50'}`}
                onClick={() => setSelectedVendor(vendor)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm truncate">{vendor.name}</h4>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">{vendor.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-foreground">{vendor.rating}</span>
                    <span className="mx-1">•</span>
                    <span>{vendor.onTimeDeliveryRate}% On-time</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedVendor ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-card p-8 rounded-xl border border-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">
                      {selectedVendor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary">{selectedVendor.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="secondary">{selectedVendor.category}</Badge>
                        <span className="text-xs text-muted-foreground">Onboarded: {selectedVendor.onboardingDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-2" />Email</Button>
                    <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-2" />Call</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 py-6 border-y border-border/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Quality Rating</p>
                    <p className="text-xl font-bold">{selectedVendor.rating}/5.0</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">On-Time Rate</p>
                    <p className="text-xl font-bold">{selectedVendor.onTimeDeliveryRate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Disputes</p>
                    <p className="text-xl font-bold">{selectedVendor.disputeCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Compliance</p>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800">Verified</Badge>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">Performance History</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="shadow-none border-border">
                      <CardContent className="p-4 flex items-center gap-4">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs font-bold uppercase text-muted-foreground">Success Rate</p>
                          <p className="text-sm font-medium">High reliability across all orders</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border-border">
                      <CardContent className="p-4 flex items-center gap-4">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        <div>
                          <p className="text-xs font-bold uppercase text-muted-foreground">Alerts</p>
                          <p className="text-sm font-medium">{selectedVendor.disputeCount} resolved disputes</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-xl border-border">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-primary">No Vendor Selected</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2">
                Select a vendor from the list to view their detailed performance analytics and history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
