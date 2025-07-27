import { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '@/lib/mongoDB'
import { Order } from '@/models/OrderModel'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await connectDB()
    const { userId, userType } = req.query

    if (!userId || !userType) {
      return res.status(400).json({ error: 'userId and userType are required' })
    }

    let orders
    if (userType === 'vendor') {
      orders = await Order.find({ vendorId: userId })
        .populate('supplierId', 'storeName location phone')
        .populate('products.productId', 'name price')
        .sort({ createdAt: -1 })
    } else if (userType === 'supplier') {
      orders = await Order.find({ supplierId: userId })
        .populate('vendorId', 'storeName location phone')
        .populate('products.productId', 'name price')
        .sort({ createdAt: -1 })
    } else {
      return res.status(400).json({ error: 'Invalid userType' })
    }

    res.status(200).json({ orders })
  } catch (err) {
    console.error('Fetch Orders Error:', err)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
}
