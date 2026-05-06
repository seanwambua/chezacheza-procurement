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
  selectedYear: string;
  
  // Actions
  setSelectedYear: (year: string) => void;
  addPR: (pr: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'refNumber' | 'fiscalYear'>) => void;
  updatePR: (id: string, updates: Partial<PurchaseRequisition>) => void;
  deletePR: (id: string) => void;
  updatePRStatus: (id: string, status: PurchaseRequisition['status']) => void;
  addVendor: (vendor: Vendor) => void;
  addLPO: (lpo: Omit<LPO, 'fiscalYear'>) => void;
  updateLPO: (id: string, updates: Partial<LPO>) => void;
  deleteLPO: (id: string) => void;
  updateLPOStatus: (id: string, status: LPO['status']) => void;
  addGRN: (grn: Omit<GRN, 'fiscalYear'>) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'spent' | 'committed'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  deleteFiscalYear: (year: string) => void;
}

const isCommitted = (status: PRStatus) => status !== 'Draft' && status !== 'Rejected';

export const useStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      prs: MOCK_PRS,
      vendors: MOCK_VENDORS,
      lpos: MOCK_LPOS,
      grns: MOCK_GRNS,
      budgets: MOCK_BUDGETS,
      selectedYear: '2024',

      setSelectedYear: (selectedYear) => set({ selectedYear }),

      addPR: (prData) => set((state) => {
        const id = `PR-${Math.floor(Math.random() * 10000)}`;
        const refNumber = `REQ/${state.selectedYear}/${String(state.prs.length + 1).padStart(3, '0')}`;
        const newPR: PurchaseRequisition = {
          ...prData,
          id,
          refNumber,
          fiscalYear: state.selectedYear,
          createdAt: new Date().toISOString(),
        };

        const prTotal = calculatePRTotal(newPR);

        const updatedBudgets = state.budgets.map(b => {
          if (b.name === newPR.budgetLine && b.fiscalYear === state.selectedYear && isCommitted(newPR.status)) {
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
          if (b.name === oldPR.budgetLine && b.fiscalYear === oldPR.fiscalYear && wasCommitted) {
            committed -= oldTotal;
          }
          if (b.name === newPR.budgetLine && b.fiscalYear === newPR.fiscalYear && isNowCommitted) {
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
          if (b.name === prToDelete.budgetLine && b.fiscalYear === prToDelete.fiscalYear && isCommitted(prToDelete.status)) {
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
          if (b.name === pr.budgetLine && b.fiscalYear === pr.fiscalYear) {
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

      addLPO: (lpoData) => set((state) => ({
        lpos: [...state.lpos, { ...lpoData, fiscalYear: state.selectedYear }]
      })),

      updateLPO: (id, updates) => set((state) => ({
        lpos: state.lpos.map(lpo => lpo.id === id ? { ...lpo, ...updates } : lpo)
      })),

      deleteLPO: (id) => set((state) => ({
        lpos: state.lpos.filter(lpo => lpo.id !== id)
      })),

      updateLPOStatus: (id, status) => set((state) => ({
        lpos: state.lpos.map(lpo => lpo.id === id ? { ...lpo, status } : lpo)
      })),

      addGRN: (grnData) => set((state) => {
        const grn = { ...grnData, fiscalYear: state.selectedYear };
        const updatedLpos = state.lpos.map(lpo => 
          lpo.id === grn.lpoId ? { ...lpo, status: grn.disputeFlag ? 'Partially Fulfilled' : 'Fulfilled' as any } : lpo
        );

        const lpo = state.lpos.find(l => l.id === grn.lpoId);
        const updatedBudgets = state.budgets.map(b => {
          const pr = state.prs.find(p => p.id === lpo?.prId);
          if (lpo && pr && b.name === pr.budgetLine && b.fiscalYear === pr.fiscalYear) {
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

      deleteFiscalYear: (year) => set((state) => ({
        budgets: state.budgets.filter(b => b.fiscalYear !== year),
        prs: state.prs.filter(p => p.fiscalYear !== year),
        lpos: state.lpos.filter(l => l.fiscalYear !== year),
        grns: state.grns.filter(g => g.fiscalYear !== year),
      })),
    }),
    {
      name: 'procurement-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);