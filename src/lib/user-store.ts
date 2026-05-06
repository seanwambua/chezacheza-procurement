
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from './types';
import { MOCK_USERS } from './mock-data';

interface UserState {
  users: User[];
  
  // Actions
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      users: MOCK_USERS,

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
    }),
    {
      name: 'user-management-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
