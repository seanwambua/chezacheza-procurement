import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PurchaseRequisition, Vendor, LPO, Budget, GRN, PRStatus, calculatePRTotal, FiscalYear } from './types';
import { MOCK_PRS, MOCK_VENDORS, MOCK_LPOS, MOCK_BUDGETS, MOCK_GRNS, MOCK_FISCAL_YEARS } from './mock-data';

interface ProcurementState {
  prs: PurchaseRequisition[];
  vendors: Vendor[];
  lpos: LPO[];
  grns: GRN[];
  budgets: Budget[];
  fiscalYears: FiscalYear[];
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
  
  // Fiscal Year CRUD
  addFiscalYear: (fy: Omit<FiscalYear, 'id' | 'createdAt'>) => void;
  updateFiscalYear: (id: string, updates: Partial<FiscalYear>) => void;
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
      fiscalYears: MOCK_FISCAL_YEARS,
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

        const linkedLpos = state.lpos.filter(l => l.prId === id);
        const linkedLpoIds = linkedLpos.map(l => l.id);

        return { 
          prs: state.prs.filter(pr => pr.id !== id),
          budgets: updatedBudgets,
          lpos: state.lpos.filter(l => l.prId !== id),
          grns: state.grns.filter(g => !linkedLpoIds.includes(g.lpoId))
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

      deleteLPO: (id) => set((state) => {
        const lpo = state.lpos.find(l => l.id === id);
        if (!lpo) return state;

        const updatedPrs = state.prs.map(pr => 
          pr.id === lpo.prId ? { ...pr, status: 'Approved' as PRStatus } : pr
        );

        const updatedGrns = state.grns.filter(g => g.lpoId !== id);

        const linkedGrn = state.grns.find(g => g.lpoId === id);
        const updatedBudgets = state.budgets.map(b => {
          const pr = state.prs.find(p => p.id === lpo.prId);
          if (pr && b.name === pr.budgetLine && b.fiscalYear === pr.fiscalYear) {
            if (linkedGrn) {
              return {
                ...b,
                spent: Math.max(0, b.spent - lpo.totalValue),
                committed: b.committed + lpo.totalValue
              };
            }
          }
          return b;
        });

        return {
          lpos: state.lpos.filter(l => l.id !== id),
          prs: updatedPrs,
          grns: updatedGrns,
          budgets: updatedBudgets
        };
      }),

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

      deleteBudget: (id) => set((state) => {
        const budgetToDelete = state.budgets.find(b => b.id === id);
        if (!budgetToDelete) return state;

        const updatedPrs = state.prs.filter(p => p.budgetLine !== budgetToDelete.name || p.fiscalYear !== budgetToDelete.fiscalYear);
        const lposToDelete = state.lpos.filter(l => {
          const pr = state.prs.find(p => p.id === l.prId);
          return pr && pr.budgetLine === budgetToDelete.name && pr.fiscalYear === budgetToDelete.fiscalYear;
        });
        const lpoIds = lposToDelete.map(l => l.id);
        
        return {
          budgets: state.budgets.filter(b => b.id !== id),
          prs: updatedPrs,
          lpos: state.lpos.filter(l => !lpoIds.includes(l.id)),
          grns: state.grns.filter(g => !lpoIds.includes(g.lpoId))
        };
      }),

      addFiscalYear: (fyData) => set((state) => {
        const newFY: FiscalYear = {
          ...fyData,
          id: `FY-${fyData.year}`,
          createdAt: new Date().toISOString(),
        };
        return { fiscalYears: [...state.fiscalYears, newFY] };
      }),

      updateFiscalYear: (id, updates) => set((state) => ({
        fiscalYears: state.fiscalYears.map(fy => fy.id === id ? { ...fy, ...updates } : fy)
      })),

      deleteFiscalYear: (year) => set((state) => ({
        fiscalYears: state.fiscalYears.filter(fy => fy.year !== year),
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