"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Plus, Search, MoreVertical, Pencil, Trash2, UserPlus, Shield, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStore } from '@/lib/user-store';
import { User, UserRole } from '@/lib/types';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { cn } from '@/lib/utils';

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['Admin', 'Manager', 'Staff', 'Finance'] as const),
  department: z.string().min(2, "Department is required"),
  status: z.enum(['Active', 'Inactive'] as const),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus, currentUser, viewPreference } = useUserStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  const isDetailed = viewPreference === 'detailed';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Staff',
      department: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingUser) {
      form.reset({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        status: editingUser.status,
      });
    } else {
      form.reset({
        name: '',
        email: '',
        role: 'Staff',
        department: '',
        status: 'Active',
      });
    }
  }, [editingUser, form]);

  if (!mounted) return null;

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 px-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">Only system administrators can manage users and roles. Please contact support if you believe this is an error.</p>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.department.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (values: UserFormValues) => {
    if (editingUser) {
      updateUser(editingUser.id, values);
    } else {
      addUser(values);
    }
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Users
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Manage user accounts, roles, and access permissions.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingUser(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary font-bold uppercase text-xs h-10 shadow-sm" onClick={() => setEditingUser(null)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">{editingUser ? 'Edit User Profile' : 'Create New User'}</DialogTitle>
              <DialogDescription className="text-xs font-medium">Configure access levels and departmental assignments.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-10 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@chezacheza.org" {...field} className="h-10 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">System Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['Admin', 'Manager', 'Finance', 'Staff'].map(r => (
                              <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active" className="text-xs">Active</SelectItem>
                            <SelectItem value="Inactive" className="text-xs">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Finance, Operations" {...field} className="h-10 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0 pt-6 flex-col sm:flex-row border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto font-bold uppercase text-xs h-10">Cancel</Button>
                  <Button type="submit" className="w-full sm:w-auto bg-primary shadow-md font-bold uppercase text-xs h-10">
                    {editingUser ? 'Save Changes' : 'Create Account'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="w-full pl-9 h-10 text-xs bg-muted/30 border-none shadow-none focus-visible:ring-1" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-none">
                <TableHead className="min-w-[200px] font-bold uppercase text-[10px]">User</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Role</TableHead>
                {isDetailed && <TableHead className="font-bold uppercase text-[10px]">Department</TableHead>}
                <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                {isDetailed && <TableHead className="font-bold uppercase text-[10px] text-right">Joined</TableHead>}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-black text-[10px] shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate text-primary">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate opacity-70 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className={cn(
                          "w-3 h-3",
                          user.role === 'Admin' ? "text-accent" : "text-muted-foreground opacity-50"
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{user.role}</span>
                      </div>
                    </TableCell>
                    {isDetailed && <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">{user.department}</TableCell>}
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 py-0 h-4 tracking-tighter">
                        {user.status}
                      </Badge>
                    </TableCell>
                    {isDetailed && (
                      <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap font-bold">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingUser(user); setIsDialogOpen(true); }} className="text-xs font-bold">
                            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user.id)} className="text-xs font-bold">
                            <Plus className="w-4 h-4 mr-2" /> {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if(confirm('Delete user?')) deleteUser(user.id); }} className="text-destructive text-xs font-bold">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                     <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                        <div className="p-4 bg-muted rounded-full">
                          <Search className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">No system users found.</p>
                      </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
