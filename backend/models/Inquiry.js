import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  agentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',     default: null },
  message:    { type: String, required: true, trim: true },
  inquiryType: { type: String, enum: ['general', 'inspection', 'offer', 'rental'], default: 'general' },
  preferredContact: { type: String, enum: ['email', 'phone', 'whatsapp'], default: 'email' },
  status:     { type: String, enum: ['pending', 'replied', 'closed', 'new', 'contacted', 'in-progress', 'resolved', 'responded'], default: 'pending' },
  responses:  [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
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



InquirySchema.index({ agentId: 1, status: 1 });
InquirySchema.index({ userId: 1 });
InquirySchema.index({ propertyId: 1 });

// Configure serialization to include virtuals
InquirySchema.set('toJSON', { virtuals: true });
InquirySchema.set('toObject', { virtuals: true });

export default mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);
