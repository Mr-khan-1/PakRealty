import mongoose from 'mongoose';

const InvestmentSchema = new mongoose.Schema({
  investorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  propertyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  amount:      { type: Number, required: true, min: 0 },
  returnRate:  { type: Number, default: 0 },
  currency:    { type: String, default: 'PKR' },
  notes:       { type: String, default: '' },
  status:      { type: String, enum: ['active', 'exited', 'pending'], default: 'active' },
}, { timestamps: true });

InvestmentSchema.index({ investorId: 1 });
InvestmentSchema.index({ propertyId: 1 });

export default mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);
