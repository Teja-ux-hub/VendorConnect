'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useStoree } from '@/lib/store'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle, XCircle, Package } from 'lucide-react'

export default function VendorOrdersPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { user, orders } = useStoree()

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    // Fetch user data from database
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/fetch')
        const data = await response.json()
        
        if (!response.ok || !data.user) {
          router.push('/onboarding')
          return
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/onboarding')
      }
    }

    fetchUserData()
  }, [isSignedIn, router])

  const vendorOrders = orders.filter(o => o.vendorId === user?.id)
  const pendingOrders = vendorOrders.filter(o => o.status === 'pending')
  const acceptedOrders = vendorOrders.filter(o => o.status === 'accepted')
  const completedOrders = vendorOrders.filter(o => o.status === 'completed')
  const rejectedOrders = vendorOrders.filter(o => o.status === 'cancelled')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <Package className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{acceptedOrders.length}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedOrders.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{rejectedOrders.length}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Orders ({vendorOrders.length})</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {vendorOrders.length > 0 ? (
              vendorOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">Order #{order.id.slice(-4)}</h3>
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
                          
                          {order.status === 'accepted' && (
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
                            className="btn-primary inline-flex items-center space-x-2"
                          >
                            <Phone className="h-4 w-4" />
                            <span>Call Seller</span>
                          </a>
                        </div>
                      )}
                      
                      {order.status === 'pending' && (
                        <div className="text-center">
                          <p className="text-sm text-yellow-600">Waiting for seller response...</p>
                        </div>
                      )}
                      
                      {order.status === 'completed' && (
                        <div className="text-center">
                          <p className="text-sm text-green-600">✅ Order completed</p>
                        </div>
                      )}
                      
                      {order.status === 'cancelled' && (
                        <div className="text-center">
                          <p className="text-sm text-red-600">❌ Order rejected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">Start ordering from nearby suppliers to see your orders here.</p>
                <button
                  onClick={() => router.push('/vendor/dashboard')}
                  className="btn-primary"
                >
                  Browse Suppliers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}