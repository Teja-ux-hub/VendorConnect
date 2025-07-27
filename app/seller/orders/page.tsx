'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle, XCircle, Package, Copy, AlertCircle } from 'lucide-react'

export default function SellerOrdersPage() {
  const { isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }
    const fetchUserAndOrders = async () => {
      setLoading(true)
      try {
        const userRes = await fetch('/api/user/fetch')
        const userData = await userRes.json()
        if (userRes.ok && userData.user) {
          setUser(userData.user)
          const ordersRes = await fetch(`/api/orders/fetch?userType=seller&userId=${userData.user.id}`)
          const ordersData = await ordersRes.json()
          if (ordersRes.ok) {
            setOrders((ordersData.orders || []).map((order: any) => ({
              ...order,
              id: order._id || order.id,
              products: order.products || order.items || [],
              totalPrice: order.totalPrice || order.totalAmount || 0,
              createdAt: order.createdAt ? new Date(order.createdAt) : undefined,
              updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined,
              vendorLocation: typeof order.vendorLocation === 'string' ? order.vendorLocation : order.vendorLocation?.address || '',
            })))
          }
        } else {
          router.push('/onboarding')
        }
      } catch (err) {
        console.error('Error loading seller orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndOrders()
  }, [isSignedIn, router])

  const sellerOrders = orders.filter(o => o.supplierId === user?.id)
  const pendingOrders = sellerOrders.filter(o => o.status === 'pending')
  const acceptedOrders = sellerOrders.filter(o => o.status === 'accepted')
  const completedOrders = sellerOrders.filter(o => o.status === 'completed')
  const rejectedOrders = sellerOrders.filter(o => o.status === 'cancelled' || o.status === 'rejected')

  const handleAcceptOrder = (orderId: string) => {
    // updateOrderStatus(orderId, 'accepted') // This function is removed from useStoree
  }

  const handleRejectOrder = (orderId: string) => {
    // updateOrderStatus(orderId, 'cancelled') // This function is removed from useStoree
  }

  const handleCompleteOrder = (orderId: string) => {
    // updateOrderStatus(orderId, 'completed') // This function is removed from useStoree
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    alert(`${type} copied: ${text}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'rejected': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <Package className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Orders</h1>
          <p className="text-gray-600">Manage your incoming orders and customer information</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{acceptedOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="space-y-6">
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">New Orders</h2>
                <p className="text-sm text-gray-600">Awaiting your response</p>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </h3>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Items:</h4>
                            <div className="space-y-1">
                              {order.products.map((item: any, idx: number) => (
                                <div key={item.productId ? `${item.productId}-${idx}` : idx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                  <span className="font-medium">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t mt-2 pt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total:</span>
                                <span>₹{order.totalPrice}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Delivery Location:</h4>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {order.vendorLocation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Accept Order</span>
                      </button>
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject Order</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Orders */}
          {acceptedOrders.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Accepted Orders</h2>
                <p className="text-sm text-gray-600">Contact information available</p>
              </div>
              <div className="divide-y divide-gray-200">
                {acceptedOrders.map((order) => (
                  <div key={order.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </h3>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Items:</h4>
                            <div className="space-y-1">
                              {order.products.map((item: any, idx: number) => (
                                <div key={item.productId ? `${item.productId}-${idx}` : idx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                  <span className="font-medium">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t mt-2 pt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total:</span>
                                <span>₹{order.totalPrice}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-800 mb-3">Customer Contact Information</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-gray-600">Customer Phone Number:</label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{order.vendorPhone}</span>
                                  <button
                                    onClick={() => copyToClipboard(order.vendorPhone, 'Phone Number')}
                                    className="text-green-600 hover:text-green-700 p-1"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-xs font-medium text-gray-600">Delivery Location:</label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">{order.vendorLocation}</span>
                                  <button
                                    onClick={() => copyToClipboard(order.vendorLocation, 'Location')}
                                    className="text-green-600 hover:text-green-700 p-1"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => handleCompleteOrder(order.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>Mark as Completed</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Orders */}
          {sellerOrders.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600">You'll see new orders here when customers place them.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}