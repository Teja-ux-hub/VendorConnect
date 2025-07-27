'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Store, Package, Bell, Plus, Edit, Trash2, Phone, MapPin, Clock, CheckCircle, XCircle, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Supplier } from '@/models/SupplierModel'

export default function SellerDashboard() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, quantity: 0 })
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch User + Products + Orders
  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/fetch')
        const data = await response.json()

        if (response.ok && data.user) {
          if (data.user.userType !== 'seller') {
            router.push('/vendor/dashboard')
            return
          }
          setUser(data.user)
          await loadProducts(data.user.id)
          await loadOrders(data.user.id)
        } else {
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/onboarding')
      }
    }

    fetchUserData()
  }, [isSignedIn, router])

  // const loadProducts = async (supplierId: string) => {
  //   try {
  //     const response = await fetch(`/api/products/fetch?type=seller&userId=${supplierId}`)
  //     const data = await response.json()
  //     if (response.ok) {
  //       setProducts(data.products || [])
  //     } else {
  //       console.error('Error loading products:', data.error)
  //     }
  //   } catch (err) {
  //     console.error('Failed to load products:', err)
  //   }
  // }

  const loadProducts = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/products/fetch?type=seller&userId=${supplierId}`)
      const data = await response.json()
      if (response.ok) {
        // Normalize the id field here
        const normalized = (data.products || []).map((product: any) => ({
          ...product,
          id: product.productId,
        }))
        setProducts(normalized)
        console.log('Products:', normalized);
      } else {
        console.error('Error loading products:', data.error)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }
  

  const loadOrders = async (supplierId: string) => {
    try {
      
      const response = await fetch(`/api/orders/fetch?userId=${supplierId}&userType=seller`)
      const data = await response.json()
      if (response.ok) {
        // Transform dates and normalize fields for frontend
        setOrders((data.orders || []).map((order: any) => ({
          ...order,
          id: order._id || order.id,
          products: order.products || order.items || [],
          totalAmount: order.totalAmount || order.totalPrice || 0,
          createdAt: order.createdAt ? new Date(order.createdAt) : undefined,
          updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined,
          vendorLocation: typeof order.vendorLocation === 'string' ? { address: order.vendorLocation } : order.vendorLocation,
          // fallback for customerPhone/location if needed
          customerPhone: order.vendorPhone || order.customerPhone || '',
          customerLocation: order.vendorLocation?.address || order.customerLocation || '',
        })))
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      
      if (response.ok) {
        toast.success(`Order ${status} successfully`)
        loadOrders(user.id)
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Error updating order')
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0 || newProduct.quantity < 0) {
      toast.error('Please fill all fields correctly')
      return
    }
    try {
      const response = await axios.post('/api/products/add', {
        ...newProduct,
        supplierId: user?.id || ''
      })
      if (response.status === 201) {
        toast.success('Product added successfully!')
        setNewProduct({ name: '', price: 0, quantity: 0 })
        setShowAddProduct(false)
        await loadProducts(user?.id || '')
      } else {
        toast.error(response.data?.error || 'Failed to add product')
      }
    } catch (err) {
      console.error('Add product error:', err)
      toast.error('Server error while adding product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/delete/${productId}`)
        setProducts(products.filter((p) => p.id !== productId))
        toast.success('Product deleted successfully!')
      } catch (err) {
        console.error('Delete product error:', err)
        toast.error('Failed to delete product')
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const acceptedOrders = orders.filter((o) => o.status === 'accepted')
  const completedOrders = orders.filter((o) => o.status === 'completed')

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Store className="h-6 w-6 mr-2" />
              {user.storeName || 'Your Store'}
            </h1>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {user.location?.address}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600" />
              {pendingOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Orders Management */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shop Orders</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{pendingOrders.length} pending</span>
                <span className="text-sm text-gray-600">{acceptedOrders.length} accepted</span>
              </div>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-blue-600 bold">New Orders Appeared! </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.products?.[0]?.name || 'Order'}</h4>
                        <p className="text-sm text-gray-600">₹{order.totalAmount} • {order.products?.[0]?.quantity || 1} items</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800')
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOrderStatus(order.id, 'accepted')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm"
                        >
                          <CheckCircle className="h-4 w-4 inline mr-1" /> Accept
                        </button>
                        <button
                          onClick={() => handleOrderStatus(order.id, 'rejected')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
                        >
                          <XCircle className="h-4 w-4 inline mr-1" /> Reject
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Items:</h4>
                      {order.products.map((item: any, idx: number) => (
                        <div key={item.productId ? `${item.productId}-${idx}` : idx} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Delivery to: {order.vendorLocation.address}
                      </p>
                    </div>
                    {order.status === 'accepted' && (
                      <div className="space-y-2 text-sm pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Customer Phone:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{order.customerPhone}</span>
                            <button
                              onClick={() => copyToClipboard(order.customerPhone)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Customer Location:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{order.customerLocation}</span>
                            <button
                              onClick={() => copyToClipboard(order.customerLocation)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          

          {/* Active Orders */}
          {acceptedOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Active Orders ({acceptedOrders.length})</h2>
              <div className="space-y-4">
                {acceptedOrders.map((order) => (
                  <div key={order.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-4)}</h3>
                        <p className="text-gray-600">₹{order.totalAmount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {order.vendorPhone}
                        </p>
                        <button
                          onClick={async () => {
                            await axios.patch(`/api/orders/update/${order.id}`, { status: 'completed' })
                            setOrders((prev) =>
                              prev.map((o) => (o.id === order.id ? { ...o, status: 'completed' } : o))
                            )
                            toast.success('Order marked completed')
                          }}
                          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Your Products ({products.length})
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{product.name}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingProduct(product.id)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-green-600 font-semibold">₹{product.price}</p>
                  <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                  {product.quantity < 10 && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Low stock</p>
                  )}
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No products added yet</p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="text-orange-500 hover:text-orange-600 font-medium mt-2"
                >
                  Add your first product
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">New Orders</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Orders</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Products</span>
                <span className="font-semibold">{products.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddProduct(true)}
                className="w-full btn-primary"
              >
                Add New Product
              </button>
              <button
                onClick={() => router.push('/seller/orders')}
                className="w-full btn-secondary"
              >
                View All Orders
              </button>
              <button
                onClick={() => {
                  const lowStock = products.filter((p) => p.quantity < 10)
                  if (lowStock.length > 0) {
                    toast.success(`${lowStock.length} products need restocking`)
                  } else {
                    toast.success('All products have good stock levels')
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg"
              >
                Check Stock Levels
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center space-x-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p>Order #{order.id.slice(-4)} - {order.status}</p>
                    <p className="text-gray-600">₹{order.totalAmount}</p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-gray-600 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Puri (50 pieces)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="Enter price per unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Available *
                </label>
                <input
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="Enter quantity in stock"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddProduct(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
