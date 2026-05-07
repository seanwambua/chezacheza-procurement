export type PRStatus = 'Draft' | 'Pending Finance' | 'Pending Manager' | 'Pending Committee' | 'Approved' | 'Rejected' | 'LPO Generated';

export interface PRItem {
  id: string;
  description: string;
  quantity: number;
  estimatedUnitPrice: number;
}

export interface PurchaseRequisition {
  id: string;
  refNumber: string;
  requesterName: string;
  items: PRItem[];
  budgetLine: string; // Used as the link to Budget.name
  status: PRStatus;
  createdAt: string;
  fiscalYear: string; // Tightly coupled with fiscal year
  rejectionReason?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  rating: number; // 1-5 average
  onTimeDeliveryRate: number; // percentage
  disputeCount: number;
  onboardingDate: string;
}

export interface LPO {
  id: string;
  lpoNumber: string;
  prId: string;
  vendorId: string;
  vendorName: string;
  fiscalYear: string; // Tightly coupled
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalValue: number;
  deliveryDate: string;
  paymentTerms: string;
  additionalTerms?: string;
  status: 'Draft' | 'Dispatched' | 'Fulfilled' | 'Partially Fulfilled' | 'Matched' | 'Closed';
  createdAt: string;
}

export interface GRN {
  id: string;
  lpoId: string;
  lpoNumber: string;
  fiscalYear: string; // Tightly coupled
  receivedDate: string;
  receivedBy: string;
  items: {
    description: string;
    orderedQty: number;
    receivedQty: number;
    qualityRating: number; // 1-5
    specificationMatch: boolean;
    condition: 'Good' | 'Damaged' | 'Wrong Item';
  }[];
  disputeFlag: boolean;
  disputeReason?: string;
  disputeStatus?: 'Open' | 'Resolved';
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface VendorFeedback {
  id: string;
  vendorId: string;
  vendorName: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  department: string;
  description: string;
  fiscalYear: string;
  q1Allocation: number;
  q2Allocation: number;
  q3Allocation: number;
  q4Allocation: number;
  spent: number;
  committed: number;
}

export interface FiscalYear {
  id: string;
  year: string;
  globalTarget: number;
  strategy: 'Growth' | 'Conservative' | 'Balanced';
  status: 'Open' | 'Closed' | 'Archived';
  q1Weight: number;
  q2Weight: number;
  q3Weight: number;
  q4Weight: number;
  createdAt: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Finance';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: ['*'],
  Manager: [
    'view_dashboard',
    'view_budgets',
    'view_departments',
    'view_requisitions',
    'create_requisitions',
    'approve_requisitions',
    'view_vendors',
    'manage_vendors',
    'view_lpos',
    'view_deliveries',
    'manage_disputes'
  ],
  Finance: [
    'view_dashboard',
    'view_budgets',
    'view_departments',
    'manage_budgets',
    'view_requisitions',
    'approve_requisitions',
    'view_vendors',
    'view_lpos',
    'view_payments',
    'manage_disputes'
  ],
  Staff: [
    'view_dashboard',
    'view_requisitions',
    'create_requisitions',
    'view_own_requisitions',
    'submit_feedback'
  ],
};

export function getCurrentQuarter(): number {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}

export function calculatePRTotal(pr: PurchaseRequisition): number {
  if (!pr || !pr.items || !Array.isArray(pr.items)) return 0;
  return pr.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.estimatedUnitPrice || 0)), 0);
}

export function getBudgetStats(budget: Budget) {
  const currentQ = getCurrentQuarter();
  const qAllocations = [
    budget.q1Allocation || 0, 
    budget.q2Allocation || 0, 
    budget.q3Allocation || 0, 
    budget.q4Allocation || 0
  ];
  
  const cumulativeAllocation = qAllocations.slice(0, currentQ).reduce((acc, val) => acc + val, 0);
  const totalAllocation = qAllocations.reduce((acc, val) => acc + val, 0);
  
  const totalUsed = (budget.spent || 0) + (budget.committed || 0);
  const isPaused = totalUsed >= cumulativeAllocation;
  const remainingInQuarter = Math.max(0, cumulativeAllocation - totalUsed);
  const remainingTotal = Math.max(0, totalAllocation - totalUsed);

  return {
    currentQ,
    cumulativeAllocation,
    totalAllocation,
    totalUsed,
    isPaused,
    remainingInQuarter,
    remainingTotal,
    utilization: totalAllocation > 0 ? (totalUsed / totalAllocation) * 100 : 0
  };
}
