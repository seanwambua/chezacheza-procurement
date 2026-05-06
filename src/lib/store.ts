import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PurchaseRequisition, Vendor, LPO, Budget, GRN, PRStatus, calculatePRTotal } from './types';
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
  updateLPOStatus: (id: string, status: LPO['status']) => void;
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

        const prTotal = calculatePRTotal(newPR);

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === newPR.budgetLine && isCommitted(newPR.status)) {
            return { ...b, committed: b.committed + prTotal };
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
        const oldTotal = calculatePRTotal(oldPR);
        const newTotal = calculatePRTotal(newPR);

        const wasCommitted = isCommitted(oldPR.status);
        const isNowCommitted = isCommitted(newPR.status);

        const updatedBudgets = state.budgets.map(b => {
          let committed = b.committed;
          if (b.name === oldPR.budgetLine && wasCommitted) {
            committed -= oldTotal;
          }
          if (b.name === newPR.budgetLine && isNowCommitted) {
            committed += newTotal;
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

        const prTotal = calculatePRTotal(prToDelete);

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === prToDelete.budgetLine && isCommitted(prToDelete.status)) {
            return { 
              ...b, 
              committed: Math.max(0, b.committed - prTotal) 
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

        const prTotal = calculatePRTotal(pr);
        const wasCommitted = isCommitted(pr.status);
        const isNowCommitted = isCommitted(status);

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === pr.budgetLine) {
            let committed = b.committed;
            if (wasCommitted && !isNowCommitted) {
              committed -= prTotal;
            } else if (!wasCommitted && isNowCommitted) {
              committed += prTotal;
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

      updateLPOStatus: (id, status) => set((state) => ({
        lpos: state.lpos.map(lpo => lpo.id === id ? { ...lpo, status } : lpo)
      })),

      addGRN: (grn) => set((state) => {
        // Find LPO and update status
        const updatedLpos = state.lpos.map(lpo => 
          lpo.id === grn.lpoId ? { ...lpo, status: grn.disputeFlag ? 'Partially Fulfilled' : 'Fulfilled' as any } : lpo
        );

        // Update budget actuals if fulfilled
        const lpo = state.lpos.find(l => l.id === grn.lpoId);
        const updatedBudgets = state.budgets.map(b => {
          if (lpo && b.id === state.prs.find(p => p.id === lpo.prId)?.budgetLine) {
            // Simplified: moving commitment to actual spent
            return {
              ...b,
              committed: Math.max(0, b.committed - lpo.totalValue),
              spent: b.spent + lpo.totalValue
            };
          }
          return b;
        });

        return {
          grns: [grn, ...state.grns],
          lpos: updatedLpos,
          budgets: updatedBudgets
        };
      }),

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
