'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useStoree, Product, Order, User, Shop } from '../../../lib/store'
import { Mic, MicOff, MapPin, Search, Clock, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VendorDashboard() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { user, setUser, isVoiceActive, setVoiceActive, nearbyShops, setNearbyShops, orders, addOrder } = useStoree()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({})
  const [isListening, setIsListening] = useState(false)

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
        
        if (response.ok && data.user) {
          if (data.user.userType !== 'vendor') {
            router.push('/seller/dashboard')
            return
          }
          setUser(data.user)
          loadNearbyShops(data.user.location)
        } else {
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/onboarding')
      }
    }

    fetchUserData()
  }, [isSignedIn, router, setUser])

  const loadNearbyShops = (location: { lat: number; lng: number }) => {
    // Mock data for nearby shops
    const mockShops = [
      {
        id: '1',
        name: 'Sharma General Store',
        distance: 0.2,
        location: { lat: location.lat + 0.001, lng: location.lng + 0.001, address: 'Near Metro Station' },
        products: [
          { id: '1', name: 'Puri (50 pieces)', price: 20, quantity: 200, sellerId: '1' },
          { id: '2', name: 'Aloo (1 kg)', price: 30, quantity: 50, sellerId: '1' },
          { id: '3', name: 'Chana (1 kg)', price: 60, quantity: 25, sellerId: '1' }
        ]
      },
      {
        id: '2',
        name: 'Krishna Supplies',
        distance: 0.5,
        location: { lat: location.lat + 0.002, lng: location.lng - 0.001, address: 'Main Market Road' },
        products: [
          { id: '4', name: 'Puri (100 pieces)', price: 35, quantity: 100, sellerId: '2' },
          { id: '5', name: 'Onion (1 kg)', price: 25, quantity: 30, sellerId: '2' },
          { id: '6', name: 'Oil (1L)', price: 120, quantity: 20, sellerId: '2' }
        ]
      },
      {
        id: '3',
        name: 'Gupta Trading Co.',
        distance: 0.8,
        location: { lat: location.lat - 0.001, lng: location.lng + 0.002, address: 'Bus Stand Area' },
        products: [
          { id: '7', name: 'Sabji Mix (1 kg)', price: 40, quantity: 15, sellerId: '3' },
          { id: '8', name: 'Spices Pack', price: 80, quantity: 10, sellerId: '3' },
          { id: '9', name: 'Puri (200 pieces)', price: 65, quantity: 50, sellerId: '3' }
        ]
      }
    ]
    setNearbyShops(mockShops)
  }

  const toggleVoice = () => {
    if (!isVoiceActive) {
      startVoiceListening()
    } else {
      stopVoiceListening()
    }
  }

  const startVoiceListening = () => {
    setIsListening(true)
    setVoiceActive(true)
    
    // Mock voice recognition
    setTimeout(() => {
      const mockQueries = [
        'मुझे 50 पूरी चाहिए',
        'आलू कहाँ मिलेगा',
        'सबसे सस्ता प्याज़ कौन देता है'
      ]
      const randomQuery = mockQueries[Math.floor(Math.random() * mockQueries.length)]
      
      if (randomQuery.includes('पूरी')) {
        setSearchQuery('puri')
        toast.success(`Voice command recognized: "${randomQuery}"`)
      } else if (randomQuery.includes('आलू')) {
        setSearchQuery('aloo')
        toast.success(`Voice command recognized: "${randomQuery}"`)
      } else {
        setSearchQuery('onion')
        toast.success(`Voice command recognized: "${randomQuery}"`)
      }
      
      setIsListening(false)
      setVoiceActive(false)
    }, 3000)
  }

  const stopVoiceListening = () => {
    setIsListening(false)
    setVoiceActive(false)
  }

  const filteredShops = nearbyShops.filter((shop: Shop) =>
    shop.products.some((product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const addToCart = (productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
    toast.success('Added to cart')
  }

  const placeOrder = (shopId: string) => {
    const shop = nearbyShops.find((s: Shop) => s.id === shopId)
    if (!shop || !user) return

    const orderProducts = shop.products
      .filter((p: Product) => selectedProducts[p.id] > 0)
      .map((p: Product) => ({
        productId: p.id,
        name: p.name,
        quantity: selectedProducts[p.id],
        price: p.price
      }))

    if (orderProducts.length === 0) {
      toast.error('Please select at least one product')
      return
    }

    const totalAmount = orderProducts.reduce((sum: number, p: { price: number; quantity: number }) => sum + (p.price * p.quantity), 0)

    const newOrder = {
      vendorId: user.id,
      sellerId: shopId,
      products: orderProducts,
      status: 'pending' as const,
      totalAmount,
      vendorLocation: user.location,
      sellerLocation: shop.location,
      vendorPhone: user.phoneNumber,
      sellerPhone: '+91 9876543210' // Mock seller phone
    }

    addOrder(newOrder)
    setSelectedProducts({})
    toast.success('Order placed successfully!')
  }

  const quickOrder = () => {
    if (!user) return
    
    const availableShop = nearbyShops[0] // Get nearest shop
    if (!availableShop) {
      toast.error('No shops available for quick order')
      return
    }

    const quickOrderProducts = [
      {
        productId: availableShop.products[0]?.id || '1',
        name: 'Quick Order Mix',
        quantity: 1,
        price: 50
      }
    ]

    const newOrder = {
      vendorId: user.id,
      sellerId: availableShop.id,
      products: quickOrderProducts,
      status: 'pending' as const,
      totalAmount: 50,
      vendorLocation: user.location,
      sellerLocation: availableShop.location,
      vendorPhone: user.phoneNumber,
      sellerPhone: '+91 9876543210',
      isQuickOrder: true
    }

    addOrder(newOrder)
    toast.success('Quick order placed! Seller will contact you soon.')
  }

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.fullName}</h1>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {user.location.address}
              </p>
            </div>
            <button
              onClick={quickOrder}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Quick Order</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Voice */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Find Suppliers</h2>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products (e.g., puri, aloo, onion)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={toggleVoice}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isVoiceActive
                      ? 'bg-red-500 hover:bg-red-600 text-white voice-pulse'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                  disabled={isListening}
                >
                  {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              {isListening && (
                <div className="mt-3 text-center">
                  <p className="text-orange-600 hindi-text">🎤 बोलिए... "मुझे 50 पूरी चाहिए"</p>
                </div>
              )}
            </div>

            {/* Nearby Shops */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Nearby Suppliers ({filteredShops.length})</h2>
              
              {filteredShops.map((shop: Shop) => (
                <div key={shop.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{shop.name}</h3>
                      <p className="text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {shop.distance} km away • {shop.location.address}
                      </p>
                    </div>
                    <button
                      onClick={() => placeOrder(shop.id)}
                      className="btn-primary"
                    >
                      Place Order
                    </button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {shop.products
                      .filter((product: Product) =>
                        !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((product: Product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-green-600 font-semibold">₹{product.price}</p>
                          <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <button
                              onClick={() => addToCart(product.id)}
                              className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded text-sm font-medium"
                            >
                              Add to Cart
                            </button>
                            {selectedProducts[product.id] > 0 && (
                              <span className="text-sm text-green-600">
                                ({selectedProducts[product.id]} added)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              
              {filteredShops.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No suppliers found for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-orange-500 hover:text-orange-600 font-medium mt-2"
                  >
                    Show all suppliers
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Orders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Active Orders ({orders.filter((o: Order) => o.status !== 'completed').length})
              </h3>
              
              <div className="space-y-3">
                {orders.filter((o: Order) => o.status !== 'completed').slice(0, 3).map((order: Order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(-4)}</p>
                        <p className="text-sm text-gray-600">₹{order.totalAmount}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    {order.isQuickOrder && (
                      <div className="mt-2">
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                          Quick Order
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {orders.filter((o: Order) => o.status !== 'completed').length === 0 && (
                  <p className="text-gray-600 text-sm">No active orders</p>
                )}
              </div>
              
              <button
                onClick={() => router.push('/vendor/orders')}
                className="w-full mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm"
              >
                View All Orders
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={quickOrder}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Quick Order</span>
                </button>
                <button
                  onClick={() => router.push('/vendor/orders')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Order History
                </button>
                <button
                  onClick={toggleVoice}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                >
                  <Mic className="h-4 w-4" />
                  <span>Voice Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}