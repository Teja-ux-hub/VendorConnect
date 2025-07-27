// import mongoose from 'mongoose'

// const OrderSchema = new mongoose.Schema({
//   vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
//   supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
//   products: [
//     {
//       productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//       quantity: { type: Number, required: true },
//     }
//   ],
//   totalPrice: { type: Number, required: true },
//   status: { 
//     type: String, 
//     enum: ['pending', 'accepted', 'rejected', 'delivered'], 
//     default: 'pending' 
//   },
//   orderedAt: { type: Date, default: Date.now },
// }, { timestamps: true })

// export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)


// models/OrderModel.ts
import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // or 'Vendor' depending on your user model
    required: true 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // or 'Supplier' depending on your user model
    required: true 
  },
  products: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      name: { type: String, required: true }, // Store product name for easy access
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // Store price at time of order
    }
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Additional fields for frontend compatibility
  vendorLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  sellerLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  vendorPhone: String,
  sellerPhone: String,
  isQuickOrder: { type: Boolean, default: false },
  
  // Timestamps
  orderedAt: { type: Date, default: Date.now },
  updatedBy: { type: String }, // Track who updated the order last
}, { 
  timestamps: true // This adds createdAt and updatedAt automatically
})

// Add indexes for better query performance
OrderSchema.index({ vendorId: 1 })
OrderSchema.index({ supplierId: 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ createdAt: -1 })

// Add virtual for order number (using last 4 characters of _id)
OrderSchema.virtual('orderNumber').get(function() {
  return this._id.toString().slice(-4)
})

// Ensure virtual fields are serialized
OrderSchema.set('toJSON', { virtuals: true })

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)