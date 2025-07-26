import mongoose from 'mongoose'

const VendorSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Clerk User ID
  name: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema)
