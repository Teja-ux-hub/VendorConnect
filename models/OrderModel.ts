import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'delivered'], 
    default: 'pending' 
  },
  orderedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)
