
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PurchaseRequisition, Vendor, LPO, BudgetLine, GRN, PRStatus } from './types';
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
  addBudgetLine: (budgetLine: Omit<BudgetLine, 'id' | 'spent' | 'committed'>) => void;
  updateBudgetLine: (id: string, updates: Partial<BudgetLine>) => void;
  deleteBudgetLine: (id: string) => void;
}

const isCommitted = (status: PRStatus) => status !== 'Draft' && status !== 'Rejected';

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

        const updatedBudgetLines = state.budgetLines.map(bl => {
          if (bl.name === newPR.budgetLine && isCommitted(newPR.status)) {
            return { ...bl, committed: bl.committed + (newPR.estimatedCost * newPR.quantity) };
          }
          return bl;
        });

        return { 
          prs: [newPR, ...state.prs],
          budgetLines: updatedBudgetLines
        };
      }),

      updatePR: (id, updates) => set((state) => {
        const oldPR = state.prs.find(p => p.id === id);
        if (!oldPR) return state;

        const newPR = { ...oldPR, ...updates };
        const oldVal = oldPR.estimatedCost * oldPR.quantity;
        const newVal = newPR.estimatedCost * newPR.quantity;

        const wasCommitted = isCommitted(oldPR.status);
        const isNowCommitted = isCommitted(newPR.status);

        const updatedBudgetLines = state.budgetLines.map(bl => {
          let committed = bl.committed;
          if (bl.name === oldPR.budgetLine && wasCommitted) {
            committed -= oldVal;
          }
          if (bl.name === newPR.budgetLine && isNowCommitted) {
            committed += newVal;
          }
          return { ...bl, committed: Math.max(0, committed) };
        });

        return {
          prs: state.prs.map(pr => pr.id === id ? newPR : pr),
          budgetLines: updatedBudgetLines
        };
      }),

      deletePR: (id) => set((state) => {
        const prToDelete = state.prs.find(p => p.id === id);
        if (!prToDelete) return state;

        const updatedBudgetLines = state.budgetLines.map(bl => {
          if (bl.name === prToDelete.budgetLine && isCommitted(prToDelete.status)) {
            return { 
              ...bl, 
              committed: Math.max(0, bl.committed - (prToDelete.estimatedCost * prToDelete.quantity)) 
            };
          }
          return bl;
        });

        return { 
          prs: state.prs.filter(pr => pr.id !== id),
          budgetLines: updatedBudgetLines
        };
      }),

      updatePRStatus: (id, status) => set((state) => {
        const pr = state.prs.find(p => p.id === id);
        if (!pr) return state;

        const oldVal = pr.estimatedCost * pr.quantity;
        const wasCommitted = isCommitted(pr.status);
        const isNowCommitted = isCommitted(status);

        const updatedBudgetLines = state.budgetLines.map(bl => {
          if (bl.name === pr.budgetLine) {
            let committed = bl.committed;
            if (wasCommitted && !isNowCommitted) {
              committed -= oldVal;
            } else if (!wasCommitted && isNowCommitted) {
              committed += oldVal;
            }
            return { ...bl, committed: Math.max(0, committed) };
          }
          return bl;
        });

        return {
          prs: state.prs.map(p => p.id === id ? { ...p, status } : p),
          budgetLines: updatedBudgetLines
        };
      }),

      addVendor: (vendor) => set((state) => ({
        vendors: [...state.vendors, vendor]
      })),

      addLPO: (lpo) => set((state) => ({
        lpos: [...state.lpos, lpo]
      })),

      addGRN: (grn) => set((state) => ({
        grns: [grn, ...state.grns]
      })),

      addBudgetLine: (blData) => set((state) => {
        const newBL: BudgetLine = {
          ...blData,
          id: `BL-${Math.floor(Math.random() * 10000)}`,
          spent: 0,
          committed: 0,
        };
        return { budgetLines: [...state.budgetLines, newBL] };
      }),

      updateBudgetLine: (id, updates) => set((state) => ({
        budgetLines: state.budgetLines.map(bl => bl.id === id ? { ...bl, ...updates } : bl)
      })),

      deleteBudgetLine: (id) => set((state) => ({
        budgetLines: state.budgetLines.filter(bl => bl.id !== id)
      })),
    }),
    {
      name: 'procurement-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
