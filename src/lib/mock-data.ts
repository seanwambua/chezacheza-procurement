
import { PurchaseRequisition, Vendor, LPO, BudgetLine, GRN } from './types';

export const MOCK_BUDGET_LINES: BudgetLine[] = [
  { id: 'BL-001', name: 'Office Equipment', allocation: 500000, spent: 120000, committed: 50000 },
  { id: 'BL-002', name: 'IT Infrastructure', allocation: 1500000, spent: 450000, committed: 200000 },
  { id: 'BL-003', name: 'Marketing Supplies', allocation: 300000, spent: 80000, committed: 25000 },
  { id: 'BL-004', name: 'General Stationery', allocation: 100000, spent: 40000, committed: 5000 },
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
  {
    id: 'V-003',
    name: 'Furniture Pro Kenya',
    email: 'info@furniturepro.com',
    phone: '+254 733 123 456',
    category: 'Furniture',
    rating: 4.2,
    onTimeDeliveryRate: 92,
    disputeCount: 2,
    onboardingDate: '2023-06-22',
  },
];

export const MOCK_PRS: PurchaseRequisition[] = [
  {
    id: 'PR-1001',
    refNumber: 'REQ/2024/001',
    requesterName: 'Jane Doe',
    itemDescription: 'High-performance Laptops for Dev Team',
    quantity: 5,
    estimatedCost: 150000,
    budgetLine: 'IT Infrastructure',
    status: 'Pending Manager',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'PR-1002',
    refNumber: 'REQ/2024/002',
    requesterName: 'John Smith',
    itemDescription: 'Ergonomic Office Chairs',
    quantity: 12,
    estimatedCost: 35000,
    budgetLine: 'Office Equipment',
    status: 'Approved',
    createdAt: '2024-03-02T14:30:00Z',
  },
  {
    id: 'PR-1003',
    refNumber: 'REQ/2024/003',
    requesterName: 'Alice Wambui',
    itemDescription: 'Branded Notebooks and Pens',
    quantity: 500,
    estimatedCost: 350,
    budgetLine: 'Marketing Supplies',
    status: 'Draft',
    createdAt: '2024-03-05T09:15:00Z',
  },
];

export const MOCK_LPOS: LPO[] = [
  {
    id: 'LPO-5001',
    lpoNumber: 'LPO/2024/201',
    prId: 'PR-1002',
    vendorId: 'V-003',
    vendorName: 'Furniture Pro Kenya',
    items: [
      { description: 'Ergonomic Office Chairs', quantity: 12, unitPrice: 35000, total: 420000 }
    ],
    totalValue: 420000,
    deliveryDate: '2024-03-20',
    paymentTerms: '30 Days Net',
    status: 'Dispatched',
    createdAt: '2024-03-04T11:00:00Z',
  }
];

export const MOCK_GRNS: GRN[] = [
  {
    id: 'GRN-9001',
    lpoId: 'LPO-5001',
    lpoNumber: 'LPO/2024/201',
    receivedDate: '2024-03-21T09:00:00Z',
    receivedBy: 'Jane Doe',
    items: [
      {
        description: 'Ergonomic Office Chairs',
        orderedQty: 12,
        receivedQty: 10,
        qualityRating: 3,
        specificationMatch: true,
        condition: 'Good'
      }
    ],
    disputeFlag: true,
    disputeReason: 'Short delivery: Received 10 out of 12 chairs.'
  }
];
