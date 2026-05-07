import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, ROLE_PERMISSIONS } from './types';
import { MOCK_USERS } from './mock-data';

export type ViewPreference = 'simple' | 'detailed';

interface UserState {
  users: User[];
  currentUser: User | null;
  viewPreference: ViewPreference;
  isSidebarCollapsed: boolean;
  hasConsentedToDataProtection: boolean;
  
  // Actions
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  setCurrentUser: (user: User | null) => void;
  setViewPreference: (pref: ViewPreference) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setConsent: (consented: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: MOCK_USERS,
      currentUser: MOCK_USERS[0],
      viewPreference: 'simple',
      isSidebarCollapsed: true,
      hasConsentedToDataProtection: false,

      addUser: (userData) => set((state) => {
        const id = `U-${Math.floor(Math.random() * 10000)}`;
        const newUser: User = {
          ...userData,
          id,
          createdAt: new Date().toISOString(),
        };
        return { users: [newUser, ...state.users] };
      }),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
      })),

      deleteUser: (id) => set((state) => ({
        users: state.users.filter(u => u.id !== id)
      })),

      toggleUserStatus: (id) => set((state) => ({
        users: state.users.map(u => 
          u.id === id 
            ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } 
            : u
        )
      })),

      setCurrentUser: (user) => set({ currentUser: user }),
      
      setViewPreference: (viewPreference) => set({ viewPreference }),
      
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),

      setConsent: (hasConsentedToDataProtection) => set({ hasConsentedToDataProtection }),

      hasPermission: (permission) => {
        const user = get().currentUser;
        if (!user) return false;
        
        // Admin has global wild-card access
        if (user.role === 'Admin') return true;
        
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(permission) || permissions.includes('*');
      },

      hasRole: (roles) => {
        const user = get().currentUser;
        if (!user) return false;
        return roles.includes(user.role);
      }
    }),
    {
      name: 'user-management-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
