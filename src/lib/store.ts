
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PurchaseRequisition, Vendor, LPO, Budget, GRN, PRStatus, getBudgetStats } from './types';
import { MOCK_PRS, MOCK_VENDORS, MOCK_LPOS, MOCK_BUDGETS, MOCK_GRNS } from './mock-data';

interface ProcurementState {
  prs: PurchaseRequisition[];
  vendors: Vendor[];
  lpos: LPO[];
  grns: GRN[];
  budgets: Budget[];
  
  // Actions
  addPR: (pr: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'refNumber'>) => void;
  updatePR: (id: string, updates: Partial<PurchaseRequisition>) => void;
  deletePR: (id: string) => void;
  updatePRStatus: (id: string, status: PurchaseRequisition['status']) => void;
  addVendor: (vendor: Vendor) => void;
  addLPO: (lpo: LPO) => void;
  addGRN: (grn: GRN) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'committed'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
}

const isCommitted = (status: PRStatus) => status !== 'Draft' && status !== 'Rejected';

export const useStore = create<ProcurementState>()(
  persist(
    (set) => ({
      prs: MOCK_PRS,
      vendors: MOCK_VENDORS,
      lpos: MOCK_LPOS,
      grns: MOCK_GRNS,
      budgets: MOCK_BUDGETS,

      addPR: (prData) => set((state) => {
        const id = `PR-${Math.floor(Math.random() * 10000)}`;
        const refNumber = `REQ/2024/${String(state.prs.length + 1).padStart(3, '0')}`;
        const newPR: PurchaseRequisition = {
          ...prData,
          id,
          refNumber,
          createdAt: new Date().toISOString(),
        };

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === newPR.budgetLine && isCommitted(newPR.status)) {
            return { ...b, committed: b.committed + (newPR.estimatedCost * newPR.quantity) };
          }
          return b;
        });

        return { 
          prs: [newPR, ...state.prs],
          budgets: updatedBudgets
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

        const updatedBudgets = state.budgets.map(b => {
          let committed = b.committed;
          if (b.name === oldPR.budgetLine && wasCommitted) {
            committed -= oldVal;
          }
          if (b.name === newPR.budgetLine && isNowCommitted) {
            committed += newVal;
          }
          return { ...b, committed: Math.max(0, committed) };
        });

        return {
          prs: state.prs.map(pr => pr.id === id ? newPR : pr),
          budgets: updatedBudgets
        };
      }),

      deletePR: (id) => set((state) => {
        const prToDelete = state.prs.find(p => p.id === id);
        if (!prToDelete) return state;

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === prToDelete.budgetLine && isCommitted(prToDelete.status)) {
            return { 
              ...b, 
              committed: Math.max(0, b.committed - (prToDelete.estimatedCost * prToDelete.quantity)) 
            };
          }
          return b;
        });

        return { 
          prs: state.prs.filter(pr => pr.id !== id),
          budgets: updatedBudgets
        };
      }),

      updatePRStatus: (id, status) => set((state) => {
        const pr = state.prs.find(p => p.id === id);
        if (!pr) return state;

        const oldVal = pr.estimatedCost * pr.quantity;
        const wasCommitted = isCommitted(pr.status);
        const isNowCommitted = isCommitted(status);

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === pr.budgetLine) {
            let committed = b.committed;
            if (wasCommitted && !isNowCommitted) {
              committed -= oldVal;
            } else if (!wasCommitted && isNowCommitted) {
              committed += oldVal;
            }
            return { ...b, committed: Math.max(0, committed) };
          }
          return b;
        });

        return {
          prs: state.prs.map(p => p.id === id ? { ...p, status } : p),
          budgets: updatedBudgets
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

      addBudget: (bData) => set((state) => {
        const newBudget: Budget = {
          ...bData,
          id: `B-${Math.floor(Math.random() * 10000)}`,
          spent: 0,
          committed: 0,
        };
        return { budgets: [...state.budgets, newBudget] };
      }),

      updateBudget: (id, updates) => set((state) => ({
        budgets: state.budgets.map(b => b.id === id ? { ...b, ...updates } : b)
      })),

      deleteBudget: (id) => set((state) => ({
        budgets: state.budgets.filter(b => b.id !== id)
      })),
    }),
    {
      name: 'procurement-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
