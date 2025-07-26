'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useStoree } from '@/lib/store'
import { Store, Package, Bell, Plus, Edit, Trash2, Phone, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SellerDashboard() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { user, setUser, products, setProducts, addProduct, updateProduct, orders, updateOrderStatus } = useStoree()
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, quantity: 0 })
  const [editingProduct, setEditingProduct] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
      return
    }

    // Load user data
    const userData = localStorage.getItem('userData')
    if (userData) {
      const parsed = JSON.parse(userData)
      if (parsed.userType !== 'seller') {
        router.push('/vendor/dashboard')
        return
      }
      setUser(parsed)
      loadProducts(parsed.id)
      loadOrders(parsed.id)
    } else {
      router.push('/onboarding')
    }
  }, [isSignedIn, router, setUser])

  const loadProducts = (sellerId: string) => {
    // Mock products for demo
    const mockProducts = [
      { id: '1', name: 'Puri (50 pieces)', price: 20, quantity: 200, sellerId },
      { id: '2', name: 'Aloo (1 kg)', price: 30, quantity: 50, sellerId },
      { id: '3', name: 'Chana (1 kg)', price: 60, quantity: 25, sellerId }
    ]
    setProducts(mockProducts)
  }

  const loadOrders = (sellerId: string) => {
    // Mock orders would be loaded here
    // For demo, we'll use the orders from the store
  }

  const handleAddProduct = () => {
    if (!newProduct.name || newProduct.price <= 0 || newProduct.quantity < 0) {
      toast.error('Please fill all fields correctly')
      return
    }

    addProduct({
      ...newProduct,
      sellerId: user?.id || ''
    })

    setNewProduct({ name: '', price: 0, quantity: 0 })
    setShowAddProduct(false)
    toast.success('Product added successfully!')
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId))
      toast.success('Product deleted successfully!')
    }
  }

  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'accepted')
    toast.success('Order accepted! Vendor contact details are now visible.')
    
    // Play notification sound (mock)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('नया ऑर्डर स्वीकार किया गया')
      utterance.lang = 'hi-IN'
      speechSynthesis.speak(utterance)
    }
  }

  const handleRejectOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled')
    toast.error('Order rejected')
  }

  const pendingOrders = orders.filter(o => o.sellerId === user?.id && o.status === 'pending')
  const activeOrders = orders.filter(o => o.sellerId === user?.id && o.status === 'accepted')
  const completedOrders = orders.filter(o => o.sellerId === user?.id && o.status === 'completed')

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Store className="h-6 w-6 mr-2" />
                {user.storeName || 'Your Store'}
              </h1>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {user.location.address}
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
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-orange-500" />
                  New Orders ({pendingOrders.length})
                </h2>
                
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">Order #{order.id.slice(-4)}</h3>
                          <p className="text-gray-600">₹{order.totalAmount}</p>
                          {order.isQuickOrder && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                              Quick Order 🚀
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Items:</h4>
                        {order.products.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Active Orders ({activeOrders.length})</h2>
                
                <div className="space-y-4">
                  {activeOrders.map((order) => (
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
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Mark Complete
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-1">Items:</h4>
                          {order.products.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.name} x {item.quantity}</span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Delivery Address:</h4>
                          <p className="text-gray-600">{order.vendorLocation.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Management */}
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
                  <span className="font-semibold">{pendingOrders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Orders</span>
                  <span className="font-semibold">{activeOrders.length}</span>
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
                    const lowStockProducts = products.filter(p => p.quantity < 10)
                    if (lowStockProducts.length > 0) {
                      toast.success(`${lowStockProducts.length} products need restocking`)
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
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity in Stock *
                </label>
                <input
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="input-field"
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddProduct(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 btn-primary"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}