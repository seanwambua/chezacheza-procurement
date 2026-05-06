
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
