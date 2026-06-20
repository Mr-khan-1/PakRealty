import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  agentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',     default: null },
  message:    { type: String, required: true, trim: true },
  inquiryType: { type: String, enum: ['general', 'inspection', 'offer', 'rental'], default: 'general' },
  preferredContact: { type: String, enum: ['email', 'phone', 'whatsapp'], default: 'email' },
  status:     { type: String, enum: ['pending', 'replied', 'closed', 'new', 'contacted', 'in-progress', 'resolved', 'responded'], default: 'pending' },
  reply:      { type: String, default: '' },
}, { timestamps: true });

// Virtual populates & setters for backward compatibility with routes/controllers
InquirySchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true
}).set(function(val) {
  this.propertyId = val;
});

InquirySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
}).set(function(val) {
  this.userId = val;
});

InquirySchema.virtual('agent', {
  ref: 'User',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true
}).set(function(val) {
  this.agentId = val;
});

// Virtual responses mapping to the single reply field
InquirySchema.virtual('responses').get(function() {
  if (!this.reply) return [];
  return [{
    sender: this.agentId,
    message: this.reply,
    createdAt: this.updatedAt || this.createdAt
  }];
});

InquirySchema.index({ agentId: 1, status: 1 });
InquirySchema.index({ userId: 1 });
InquirySchema.index({ propertyId: 1 });

// Configure serialization to include virtuals
InquirySchema.set('toJSON', { virtuals: true });
InquirySchema.set('toObject', { virtuals: true });

export default mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);
