
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PurchaseRequisition, Vendor, LPO, BudgetLine, GRN } from './types';
import { MOCK_PRS, MOCK_VENDORS, MOCK_LPOS, MOCK_BUDGET_LINES, MOCK_GRNS } from './mock-data';

interface ProcurementState {
  prs: PurchaseRequisition[];
  vendors: Vendor[];
  lpos: LPO[];
  grns: GRN[];
  budgetLines: BudgetLine[];
  
  // Actions
  addPR: (pr: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'refNumber'>) => void;
  updatePR: (id: string, updates: Partial<PurchaseRequisition>) => void;
  deletePR: (id: string) => void;
  updatePRStatus: (id: string, status: PurchaseRequisition['status']) => void;
  addVendor: (vendor: Vendor) => void;
  addLPO: (lpo: LPO) => void;
  addGRN: (grn: GRN) => void;
  updateBudgetLine: (id: string, updates: Partial<BudgetLine>) => void;
}

export const useStore = create<ProcurementState>()(
  persist(
    (set) => ({
      prs: MOCK_PRS,
      vendors: MOCK_VENDORS,
      lpos: MOCK_LPOS,
      grns: MOCK_GRNS,
      budgetLines: MOCK_BUDGET_LINES,

      addPR: (prData) => set((state) => {
        const id = `PR-${Math.floor(Math.random() * 10000)}`;
        const refNumber = `REQ/2024/${String(state.prs.length + 1).padStart(3, '0')}`;
        const newPR: PurchaseRequisition = {
          ...prData,
          id,
          refNumber,
          createdAt: new Date().toISOString(),
        };
        return { prs: [newPR, ...state.prs] };
      }),

      updatePR: (id, updates) => set((state) => ({
        prs: state.prs.map(pr => pr.id === id ? { ...pr, ...updates } : pr)
      })),

      deletePR: (id) => set((state) => ({
        prs: state.prs.filter(pr => pr.id !== id)
      })),

      updatePRStatus: (id, status) => set((state) => ({
        prs: state.prs.map(pr => pr.id === id ? { ...pr, status } : pr)
      })),

      addVendor: (vendor) => set((state) => ({
        vendors: [...state.vendors, vendor]
      })),

      addLPO: (lpo) => set((state) => ({
        lpos: [...state.lpos, lpo]
      })),

      addGRN: (grn) => set((state) => ({
        grns: [grn, ...state.grns]
      })),

      updateBudgetLine: (id, updates) => set((state) => ({
        budgetLines: state.budgetLines.map(bl => bl.id === id ? { ...bl, ...updates } : bl)
      })),
    }),
    {
      name: 'procurement-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
