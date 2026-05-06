import { PurchaseRequisition, Vendor, LPO, Budget, GRN, User, FiscalYear } from './types';

export const MOCK_FISCAL_YEARS: FiscalYear[] = [
  {
    id: 'FY-2024',
    year: '2024',
    globalTarget: 5000000,
    strategy: 'Balanced',
    status: 'Open',
    q1Weight: 25,
    q2Weight: 25,
    q3Weight: 25,
    q4Weight: 25,
    createdAt: '2023-12-01T00:00:00Z',
  }
];

export const MOCK_BUDGETS: Budget[] = [
  { 
    id: 'BL-001', 
    name: 'Office Equipment', 
    department: 'Operations',
    description: 'Furniture and electronics',
    fiscalYear: '2024',
    q1Allocation: 250000,
    q2Allocation: 250000,
    q3Allocation: 250000,
    q4Allocation: 250000,
    spent: 120000, 
    committed: 0, 
  },
  { 
    id: 'BL-002', 
    name: 'IT Infrastructure', 
    department: 'IT',
    description: 'Hardware and Cloud',
    fiscalYear: '2024',
    q1Allocation: 1000000,
    q2Allocation: 500000,
    q3Allocation: 500000,
    q4Allocation: 500000,
    spent: 450000, 
    committed: 300000,
  },
  { 
    id: 'BL-003', 
    name: 'Marketing Supplies', 
    department: 'Marketing',
    description: 'Branding and events',
    fiscalYear: '2024',
    q1Allocation: 125000,
    q2Allocation: 125000,
    q3Allocation: 125000,
    q4Allocation: 125000,
    spent: 80000, 
    committed: 0,
  },
];

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'V-001',
    name: 'TechSolutions Ltd',
    email: 'sales@techsolutions.com',
    phone: '+254 711 000 111',
    category: 'IT Hardware',
    rating: 4.8,
    onTimeDeliveryRate: 98,
    disputeCount: 1,
    onboardingDate: '2023-01-15',
  },
  {
    id: 'V-002',
    name: 'Global Office Supplies',
    email: 'orders@globaloffice.co.ke',
    phone: '+254 722 999 888',
    category: 'Stationery',
    rating: 3.5,
    onTimeDeliveryRate: 85,
    disputeCount: 4,
    onboardingDate: '2023-03-10',
  },
];

export const MOCK_PRS: PurchaseRequisition[] = [
  {
    id: 'PR-1001',
    refNumber: 'REQ/2024/001',
    requesterName: 'Jane Doe',
    items: [
      { id: 'item-1', description: 'MacBook Pro M3', quantity: 1, estimatedUnitPrice: 300000 }
    ],
    budgetLine: 'IT Infrastructure',
    fiscalYear: '2024',
    status: 'Pending Manager',
    createdAt: '2024-03-01T10:00:00Z',
  },
];

export const MOCK_LPOS: LPO[] = [
  {
    id: 'LPO-5001',
    lpoNumber: 'LPO/2024/201',
    prId: 'PR-1002',
    vendorId: 'V-001',
    vendorName: 'TechSolutions Ltd',
    fiscalYear: '2024',
    items: [{ description: 'Office Chairs', quantity: 10, unitPrice: 35000, total: 350000 }],
    totalValue: 350000,
    deliveryDate: '2024-03-20',
    paymentTerms: '30 Days Net',
    status: 'Dispatched',
    createdAt: '2024-03-04T11:00:00Z',
  }
];

export const MOCK_GRNS: GRN[] = [];

export const MOCK_USERS: User[] = [
  {
    id: 'U-001',
    name: 'Jane Doe',
    email: 'jane.doe@chezacheza.org',
    role: 'Admin',
    department: 'Operations',
    status: 'Active',
    createdAt: '2024-01-01T12:00:00Z',
  },
];