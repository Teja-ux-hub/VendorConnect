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

export interface Product {
  id: string
  name: string
  price: number
  quantity: number
  sellerId: string
}

export interface Order {
  id: string
  vendorId: string
  sellerId: string
  products: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  totalAmount: number
  vendorLocation: { lat: number; lng: number; address: string }
  sellerLocation: { lat: number; lng: number; address: string }
  vendorPhone: string
  sellerPhone: string
  isQuickOrder?: boolean
  createdAt: Date
}

export interface Shop {
  id: string;
  name: string;
  distance: number;
  location: { lat: number; lng: number; address: string };
  products: Product[];
}

interface Store {
  user: User | null
  setUser: (user: User) => void
  
  products: Product[]
  setProducts: (products: Product[]) => void
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  
  orders: Order[]
  setOrders: (orders: Order[]) => void
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  
  isVoiceActive: boolean
  setVoiceActive: (active: boolean) => void
  
  nearbyShops: Array<{
    id: string
    name: string
    distance: number
    products: Product[]
    location: { lat: number; lng: number; address: string }
  }>
  setNearbyShops: (shops: any[]) => void
}

export const useStoree = create<Store>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  products: [],
  setProducts: (products) => set({ products }),
  addProduct: (product) => {
    const newProduct = { ...product, id: Date.now().toString() }
    set((state) => ({ products: [...state.products, newProduct] }))
  },
  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  },
  
  orders: [],
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => {
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    set((state) => ({ orders: [...state.orders, newOrder] }))
  },
  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }))
  },
  
  isVoiceActive: false,
  setVoiceActive: (active) => set({ isVoiceActive: active }),
  
  nearbyShops: [],
  setNearbyShops: (shops) => set({ nearbyShops: shops })
})) 