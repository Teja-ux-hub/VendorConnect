'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle, XCircle, Package, Loader2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string;
  vendorId: string;
  sellerId: string;
  products: Array<{ productId: string; name: string; quantity: number; price: number }>;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'rejected' | 'delivered';
  totalAmount: number;
  vendorLocation: { lat: number; lng: number; address: string };
  sellerLocation: { lat: number; lng: number; address: string };
  vendorPhone: string;
  sellerPhone: string;
  isQuickOrder?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  orderNumber?: string;
}

interface OrderStats {
  pending: number;
  accepted: number;
  completed: number;
  rejected: number;
  cancelled: number;
  totalOrders: number;
  totalSpent: number;
}

export default function VendorOrdersPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    const userData = localStorage.getItem('userData')
    if (userData) {
      const parsed = JSON.parse(userData)
      if (parsed.userType !== 'vendor') {
        router.push('/seller/dashboard')
        return
      }
      setUser(parsed)
      fetchOrders(parsed.id)
    } else {
      router.push('/onboarding')
    }
  }, [isSignedIn, router])

  const fetchOrders = async (vendorId: string, status: string = 'all', page: number = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        vendorId,
        limit: '20',
        page: page.toString()
      })
      
      if (status !== 'all') {
        params.append('status', status)
      }

      const response = await fetch(`/api/vendor/orders?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      // Transform dates from strings to Date objects
      const ordersWithDates = data.orders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
      }))

      setOrders(ordersWithDates)
      setStats(data.stats)
      setTotalPages(data.pagination.totalPages)
      setCurrentPage(data.pagination.currentPage)
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
    if (user) {
      fetchOrders(user.id, status, 1)
    }
  }

  const handlePageChange = (page: number) => {
    if (user) {
      fetchOrders(user.id, statusFilter, page)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-purple-100 text-purple-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <Package className="h-4 w-4" />
      case 'delivered': return <Package className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600">Track all your orders in one place</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected + stats.cancelled}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'accepted', 'delivered', 'completed', 'rejected', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                    statusFilter === status
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status}
                  {stats && status !== 'all' && (
                    <span className="ml-1">
                      ({status === 'rejected' ? stats.rejected + stats.cancelled : (stats as any)[status] || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {statusFilter === 'all' ? 'All Orders' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`} 
                ({orders.length})
              </h2>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-orange-500" />}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">Order #{order.orderNumber || order.id.slice(-4)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </span>
                        {order.isQuickOrder && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                            Quick Order 🚀
                          </span>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Items Ordered:</h4>
                          <div className="space-y-1">
                            {order.products.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                <span className="font-medium">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 mt-2 pt-2">
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Total Amount:</span>
                              <span>₹{order.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Delivery Address:</h4>
                            <p className="text-sm text-gray-600 flex items-start">
                              <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                              {order.vendorLocation.address}
                            </p>
                          </div>
                          
                          {(order.status === 'accepted' || order.status === 'delivered') && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Contact Seller:</h4>
                              <p className="text-sm text-green-600 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {order.sellerPhone}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-xs text-gray-500">
                              Ordered on {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                            </p>
                            {order.updatedAt && order.updatedAt.getTime() !== order.createdAt.getTime() && (
                              <p className="text-xs text-gray-500">
                                Updated on {order.updatedAt.toLocaleDateString()} at {order.updatedAt.toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {order.status === 'accepted' && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Order accepted!</p>
                          <a
                            href={`tel:${order.sellerPhone}`}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2"
                          >
                            <Phone className="h-4 w-4" />
                            <span>Call Seller</span>
                          </a>
                        </div>
                      )}
                      
                      {order.status === 'pending' && (
                        <div className="text-center">
                          <p className="text-sm text-yellow-600">Waiting for seller response...</p>
                          <div className="mt-2">
                            <Clock className="h-8 w-8 text-yellow-500 mx-auto animate-pulse" />
                          </div>
                        </div>
                      )}
                      
                      {order.status === 'delivered' && (
                        <div className="text-center">
                          <p className="text-sm text-purple-600">📦 Order delivered</p>
                          <p className="text-xs text-gray-500 mt-1">Please confirm receipt</p>
                        </div>
                      )}
                      
                      {order.status === 'completed' && (
                        <div className="text-center">
                          <p className="text-sm text-green-600">✅ Order completed</p>
                          <p className="text-xs text-gray-500 mt-1">Thank you for your order!</p>
                        </div>
                      )}
                      
                      {(order.status === 'cancelled' || order.status === 'rejected') && (
                        <div className="text-center">
                          <p className="text-sm text-red-600">❌ Order {order.status}</p>
                          <p className="text-xs text-gray-500 mt-1">Contact support if needed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'all' 
                    ? 'Start ordering from nearby suppliers to see your orders here.' 
                    : `You don't have any ${statusFilter} orders at the moment.`
                  }
                </p>
                {statusFilter === 'all' ? (
                  <button
                    onClick={() => router.push('/vendor/dashboard')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Browse Suppliers
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusFilter('all')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    View All Orders
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          pageNum === currentPage
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}