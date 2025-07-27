// pages/api/orders/quick.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '@/lib/mongoDB'
import { Order } from '@/models/OrderModel'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  await connectDB()

  try {
    const {
      vendorId,
      products, // Array of products from cart
      vendorLocation,
      vendorPhone,
      preferredSupplierId, // Optional: if user wants a specific supplier
    } = req.body

    // Validate required fields
    if (!vendorId || !products || !products.length) {
      return res.status(400).json({ 
        error: 'Missing required fields: vendorId, products' 
      })
    }

    // Calculate total amount
    const totalAmount = products.reduce((sum: number, product: any) => 
      sum + (product.price * product.quantity), 0
    )

    // For quick order, we'll assign to the first available supplier
    // In a real app, you might want to find the closest supplier or one with the products in stock
    let supplierId = preferredSupplierId

    if (!supplierId) {
      // Find a supplier that has these products (simplified logic)
      // You might want to implement more sophisticated supplier selection
      const { User } = require('@/models/UserModel') // Adjust import based on your user model
      const supplier = await User.findOne({ userType: 'supplier' }).limit(1)
      
      if (!supplier) {
        return res.status(400).json({ error: 'No suppliers available for quick order' })
      }
      
      supplierId = supplier._id
    }

    // Transform products for storage
    const transformedProducts = products.map((product: any) => ({
      productId: product.productId || product.id,
      name: product.name,
      quantity: product.quantity,
      price: product.price
    }))

    // Create quick order
    const quickOrder = new Order({
      vendorId,
      supplierId,
      products: transformedProducts,
      totalPrice: totalAmount,
      status: 'pending',
      isQuickOrder: true,
      vendorLocation,
      vendorPhone,
      // For quick orders, we might not have complete supplier info initially
      sellerPhone: '+91 9876543210', // Default or fetch from supplier
    })

    const savedOrder = await quickOrder.save()

    // Populate the order for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('supplierId', 'storeName location phone')
      .populate('vendorId', 'storeName location phone')

    // Transform for frontend compatibility
    const responseOrder = {
      id: savedOrder._id.toString(),
      vendorId: savedOrder.vendorId,
      sellerId: savedOrder.supplierId,
      products: transformedProducts,
      status: savedOrder.status,
      totalAmount: savedOrder.totalPrice,
      vendorLocation: savedOrder.vendorLocation,
      sellerLocation: populatedOrder?.supplierId?.location || null,
      vendorPhone: savedOrder.vendorPhone,
      sellerPhone: savedOrder.sellerPhone,
      isQuickOrder: true,
      createdAt: savedOrder.createdAt
    }

    // Here you might want to send notifications to the supplier
    // await sendNotificationToSupplier(supplierId, savedOrder)

    res.status(201).json({ 
      message: 'Quick order placed successfully! Supplier will contact you soon.',
      order: responseOrder
    })

  } catch (error) {
    console.error('Quick Order Error:', error)
    res.status(500).json({ error: 'Failed to place quick order' })
  }
}

// Optional: Helper function to send notifications
async function sendNotificationToSupplier(supplierId: string, order: any) {
  // Implement your notification logic here
  // This could be email, SMS, or push notification
  console.log(`Notification sent to supplier ${supplierId} for order ${order._id}`)
}