import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateProfileImage: (imageUrl: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  updateProfileImage: (imageUrl) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, imagemUrl: imageUrl } : null,
    })),
  logout: () => set({ currentUser: null }),
}));
