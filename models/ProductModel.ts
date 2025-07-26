import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'kg' }, // or 'litre' or 'piece'
  inStock: { type: Boolean, default: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)
