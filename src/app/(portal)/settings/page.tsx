
"use client";

import { useEffect, useState } from 'react';
import { useUserStore } from '@/lib/user-store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Layout, Maximize2, User, Bell, Shield, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { viewPreference, setViewPreference, currentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Preferences & Settings</h2>
        <p className="text-muted-foreground">Customize your portal experience and workspace layout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-border shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent" />
              <CardTitle>Display Interface</CardTitle>
            </div>
            <CardDescription>Choose how information is presented across the portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={viewPreference} 
              onValueChange={(val) => setViewPreference(val as any)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="simple" id="simple" className="peer sr-only" />
                <Label
                  htmlFor="simple"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer transition-all"
                >
                  <Layout className="mb-3 h-6 w-6" />
                  <span className="text-sm font-bold uppercase tracking-tight">Simple View</span>
                  <span className="text-[10px] text-muted-foreground text-center mt-1">Focused experience with fewer columns and larger text.</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="detailed" id="detailed" className="peer sr-only" />
                <Label
                  htmlFor="detailed"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer transition-all"
                >
                  <Maximize2 className="mb-3 h-6 w-6" />
                  <span className="text-sm font-bold uppercase tracking-tight">Detailed View</span>
                  <span className="text-[10px] text-muted-foreground text-center mt-1">Data-dense interface for professional power users.</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none h-fit">
          <CardHeader>
             <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              <CardTitle>Account Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">User</p>
              <p className="text-sm font-bold">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">System Role</p>
              <p className="text-sm font-bold">{currentUser.role}</p>
            </div>
            <Separator />
            <div className="pt-2">
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                Role-based permissions are managed by system administrators. Contact IT if you need access elevation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
