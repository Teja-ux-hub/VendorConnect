import { create } from 'zustand'

export interface User {
  id: string
  userType: 'vendor' | 'supplier'
  fullName: string
  phoneNumber: string
  location: {
    lat: number
    lng: number
    address: string
  }
  storeName?: string
}

export interface Order {
  id: string
  vendorId: string
  supplierId: string
  products: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
  totalPrice: number
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  vendorLocation: string
  vendorPhone: string
  sellerPhone?: string
  createdAt: string
  updatedAt: string
}

interface Store {
  user: User | null
  orders: Order[]
  setUser: (user: User) => void
  clearUser: () => void
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  fetchOrders: (userId: string, userType: string) => Promise<void>
}

export const useStoree = create<Store>((set) => ({
  user: null,
  orders: [],
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, orders: [] }),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(order =>
      order.id === orderId ? { ...order, status } : order
    )
  })),
  fetchOrders: async (userId: string, userType: string) => {
    try {
      const response = await fetch(`/api/orders/fetch?userId=${userId}&userType=${userType}`);
      const data = await response.json();
      if (data.orders) {
        set({ orders: data.orders });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }
}))
