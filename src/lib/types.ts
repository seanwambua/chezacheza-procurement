
export type PRStatus = 'Draft' | 'Pending Finance' | 'Pending Manager' | 'Pending Committee' | 'Approved' | 'Rejected' | 'LPO Generated';

export interface PurchaseRequisition {
  id: string;
  refNumber: string;
  requesterName: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  budgetLine: string;
  status: PRStatus;
  createdAt: string;
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
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalValue: number;
  deliveryDate: string;
  paymentTerms: string;
  status: 'Draft' | 'Dispatched' | 'Fulfilled' | 'Partially Fulfilled' | 'Matched' | 'Closed';
  createdAt: string;
}

export interface GRN {
  id: string;
  lpoId: string;
  lpoNumber: string;
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
}

export interface BudgetLine {
  id: string;
  name: string;
  allocation: number;
  spent: number;
  committed: number;
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

// RBAC Permissions Mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Admin: ['*'], // Access to everything
  Manager: [
    'view_dashboard',
    'view_budgets',
    'view_requisitions',
    'create_requisitions',
    'approve_requisitions',
    'view_vendors',
    'manage_vendors',
    'view_lpos',
    'view_deliveries'
  ],
  Finance: [
    'view_dashboard',
    'view_budgets',
    'manage_budgets',
    'view_requisitions',
    'approve_requisitions',
    'view_vendors',
    'view_lpos',
    'view_payments'
  ],
  Staff: [
    'view_dashboard',
    'view_requisitions',
    'create_requisitions',
    'view_own_requisitions'
  ],
};
