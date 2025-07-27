'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, MapPin, Search, Clock, ShoppingCart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/* ------------------- Types ------------------- */
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Shop {
  id: string;
  name: string;
  distance: number;
  location: { lat: number; lng: number; address: string };
  products: Product[];
}

interface User {
  id: string;
  userType: 'vendor' | 'seller';
  fullName: string;
  phoneNumber: string;
  location: { lat: number; lng: number; address: string };
}

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
  orderNumber?: string;
}

/* ------------------- Component ------------------- */
export default function VendorDashboard() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isVoiceActive, setVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  /* ------------------- Load User & Shops ------------------- */
  useEffect(() => {
    if (!isSignedIn) {
      router.push('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/fetch');
        const data = await response.json();

        if (response.ok && data.user) {
          if (data.user.userType !== 'vendor') {
            router.push('/seller/dashboard');
            return;
          }
          
          // Check if user has complete profile
          if (data.user.name && data.user.phone && data.user.location) {
            setUser(data.user);
            fetchNearbyShops(data.user.location);
            fetchOrders(data.user.id);
          } else {
            // Profile incomplete - redirect to onboarding
            router.push('/onboarding');
          }
        } else {
          // User doesn't exist - redirect to onboarding
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/onboarding');
      }
    };

    fetchUserData();
  }, [isSignedIn, router]);

  const fetchNearbyShops = async (location: { lat: number; lng: number }) => {
    try {
      const res = await fetch(`/api/shops?lat=${location.lat}&lng=${location.lng}`);
      if (!res.ok) throw new Error('Failed to fetch shops');
      const data = await res.json();
      setNearbyShops(data.shops || []);
    } catch (error) {
      console.error('Error loading nearby shops:', error);
      toast.error('Unable to load nearby shops. Please try again.');
    }
  };

  const fetchOrders = async (vendorId: string) => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/vendor/orders?vendorId=${vendorId}&limit=20`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      
      // Transform dates from strings to Date objects
      const ordersWithDates = data.orders.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt)
      }));
      
      setOrders(ordersWithDates);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Unable to load orders. Please try again.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  /* ------------------- Voice Search ------------------- */
  const toggleVoice = () => {
    isVoiceActive ? stopVoiceListening() : startVoiceListening();
  };

  const startVoiceListening = () => {
    setIsListening(true);
    setVoiceActive(true);

    setTimeout(() => {
      const mockQueries = ['मुझे 50 पूरी चाहिए', 'आलू कहाँ मिलेगा', 'सबसे सस्ता प्याज़ कौन देता है'];
      const randomQuery = mockQueries[Math.floor(Math.random() * mockQueries.length)];

      if (randomQuery.includes('पूरी')) setSearchQuery('puri');
      else if (randomQuery.includes('आलू')) setSearchQuery('aloo');
      else setSearchQuery('onion');

      toast.success(`Voice command recognized: "${randomQuery}"`);
      setIsListening(false);
      setVoiceActive(false);
    }, 3000);
  };

  const stopVoiceListening = () => {
    setIsListening(false);
    setVoiceActive(false);
  };

  /* ------------------- Cart ------------------- */
  const addToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId] > 1) updated[productId] -= 1;
      else delete updated[productId];
      return updated;
    });
  };

  /* ------------------- Order Creation ------------------- */
  const createOrderInDB = async (orderData: any) => {
    try {
      const res = await fetch("/api/orders/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      
      // Transform the response to match our frontend format
      return {
        ...data.order,
        createdAt: new Date(data.order.createdAt)
      };
    } catch (err) {
      toast.error("Error saving order");
      console.error(err);
      return null;
    }
  };

  const placeOrder = async (shopId: string) => {
    if (!user) return;

    const shop = nearbyShops.find((s) => s.id === shopId);
    if (!shop) return;

    const orderProducts = shop.products
      .filter((p) => cart[p.id] > 0)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        quantity: cart[p.id],
        price: p.price,
      }));

    if (!orderProducts.length) {
      toast.error('Please add products to cart');
      return;
    }

    setIsPlacingOrder(true);

    const totalAmount = orderProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const orderData = {
      vendorId: user.id,
      sellerId: shop.id,
      products: orderProducts,
      totalAmount,
      vendorLocation: user.location,
      sellerLocation: shop.location,
      vendorPhone: user.phoneNumber,
      sellerPhone: '+91 9876543210',
      isQuickOrder: false
    };

    const savedOrder = await createOrderInDB(orderData);
    if (savedOrder) {
      setOrders((prev) => [savedOrder, ...prev]);
      setCart({});
      toast.success('Order placed successfully!');
    }
    
    setIsPlacingOrder(false);
  };
//////////////////////////////////
  const quickOrder = async () => {
    if (!user || !nearbyShops.length) {
      toast.error('No shops available for quick order');
      return;
    }

    // Get all items from cart across all shops
    const allCartItems: any[] = [];
    
    nearbyShops.forEach(shop => {
      shop.products.forEach(product => {
        if (cart[product.id] > 0) {
          allCartItems.push({
            productId: product.id,
            name: product.name,
            quantity: cart[product.id],
            price: product.price,
          });
        }
      });
    });

    if (!allCartItems.length) {
      toast.error('Your cart is empty. Add items first.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const res = await fetch('/api/orders/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: user.id,
          products: allCartItems,
          vendorLocation: user.location,
          vendorPhone: user.phoneNumber,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place quick order');
      }

      const quickOrderData = {
        ...data.order,
        createdAt: new Date(data.order.createdAt)
      };

      setOrders((prev) => [quickOrderData, ...prev]);
      setCart({});
      toast.success('Quick order placed! Supplier will contact you soon.');
      
    } catch (error) {
      console.error('Quick order error:', error);
      toast.error('Failed to place quick order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /* ------------------- Filtering ------------------- */
  const filteredShops = nearbyShops.filter((shop) =>
    shop.products.some((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate cart total
  const cartTotal = Object.entries(cart).reduce((total, [productId, quantity]) => {
    const product = nearbyShops.flatMap(shop => shop.products).find(p => p.id === productId);
    return total + (product ? product.price * quantity : 0);
  }, 0);

  const cartItemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  /* ------------------- Render ------------------- */
  if (!user)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.fullName}</h1>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {user.location.address}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {cartItemCount > 0 && (
              <div className="text-sm text-gray-600">
                Cart: {cartItemCount} items (₹{cartTotal})
              </div>
            )}
            <button
              onClick={quickOrder}
              disabled={isPlacingOrder || cartItemCount === 0}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
            >
              {isPlacingOrder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>Quick Order</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
        {/* Shops */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={toggleVoice}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isVoiceActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
                disabled={isListening}
              >
                {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            {isListening && <p className="mt-3 text-center text-orange-600">🎤 बोलिए... "मुझे 50 पूरी चाहिए"</p>}
          </div>

          {/* Shop List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Nearby Suppliers ({filteredShops.length})</h2>
            {filteredShops.map((shop) => (
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
                    disabled={isPlacingOrder || !shop.products.some(p => cart[p.id] > 0)}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2"
                  >
                    {isPlacingOrder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    <span>Place Order</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {shop.products
                    .filter((product) => !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-green-600 font-semibold">₹{product.price}</p>
                        <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            disabled={!cart[product.id]}
                            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-2 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{cart[product.id] || 0}</span>
                          <button
                            onClick={() => addToCart(product.id)}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded text-sm font-medium"
                          >
                            +
                          </button>
                        </div>
                        {cart[product.id] > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Subtotal: ₹{product.price * cart[product.id]}
                          </p>
                        )}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" /> 
                Active Orders ({orders.filter((o) => !['completed', 'cancelled', 'rejected'].includes(o.status)).length})
              </h3>
              {isLoadingOrders && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
            </div>
            
            <div className="space-y-3">
              {orders
                .filter((o) => !['completed', 'cancelled', 'rejected'].includes(o.status))
                .slice(0, 3)
                .map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Order #{order.orderNumber || order.id.slice(-4)}</p>
                        <p className="text-sm text-gray-600">₹{order.totalAmount}</p>
                        <p className="text-xs text-gray-500">
                          {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {order.isQuickOrder && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                          Quick Order 🚀
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {order.products.length} item{order.products.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              {orders.filter((o) => !['completed', 'cancelled', 'rejected'].includes(o.status)).length === 0 && (
                <p className="text-gray-600 text-sm">No active orders</p>
              )}
            </div>
            
            <button
              onClick={() => router.push('/vendor/orders')}
              className="w-full mt-4 text-orange-500 hover:text-orange-600 font-medium text-sm"
            >
              View All Orders →
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={quickOrder}
                disabled={isPlacingOrder || cartItemCount === 0}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                {isPlacingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span>Quick Order{cartItemCount > 0 ? ` (${cartItemCount})` : ''}</span>
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
                <Mic className="h-4 w-4" /> <span>Voice Search</span>
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          {cartItemCount > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Cart Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>{cartItemCount}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}