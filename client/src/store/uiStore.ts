import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  notificationCount: number;
  createPostModalOpen: boolean;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationCount: (count: number) => void;
  incrementNotifications: () => void;
  setCreatePostModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: true,
      notificationCount: 0,
      createPostModalOpen: false,

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setNotificationCount: (notificationCount) => set({ notificationCount }),
      incrementNotifications: () =>
        set((state) => ({ notificationCount: state.notificationCount + 1 })),
      setCreatePostModalOpen: (createPostModalOpen) => set({ createPostModalOpen }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
