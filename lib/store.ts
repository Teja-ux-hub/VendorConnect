import { create } from 'zustand'

export interface User {
  id: string
  userType: 'vendor' | 'seller'
  fullName: string
  phoneNumber: string
  location: {
    lat: number
    lng: number
    address: string
  }
  storeName?: string
}

interface Store {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useStoree = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
