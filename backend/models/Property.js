import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  url:      { type: String, required: true },
  alt:      { type: String, default: '' },
  source:   {
    type: String,
    enum: ['upload', 'url', 'scraped'],
    default: 'url'
  },
}, { _id: false });

const PropertySchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  price:        { type: Number, required: true, min: 0 },
  priceUnit:    { type: String, default: 'PKR' },
  priceRaw:     { type: String, default: '' },
  type:         { type: String, enum: ['House','Apartment','Plot','Commercial'], required: true },
  category:     { type: String, enum: ['residential','commercial'], default: 'residential' },
  purpose:      { type: String, enum: ['sale','rent'], required: true },
  bedrooms:     { type: Number, default: null },
  bathrooms:    { type: Number, default: null },
  kitchens:     { type: Number, default: null },
  parking:      { type: Number, default: null },
  area: {
    value:      { type: Number, default: null },
    unit:       { type: String, enum: ['marla','sqft','kanal'], default: 'marla' },
  },
  location: {
    address:    { type: String, default: '' },
    area:       { type: String, default: '' },
    city:       { type: String, required: true },
    coordinates: {
      latitude:  { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  images:       { type: [ImageSchema], default: [] },
  thumbnail:    { type: String, default: '' },
  status:       { type: String, enum: ['available','sold','rented'], default: 'available' },
  agentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  addedBy:      { type: String, enum: ['agent','admin','scraper'], default: 'agent' },
  isExternal:   { type: Boolean, default: false },
  sourceSite:   { type: String, default: '' },
  sourceUrl:    { type: String, default: undefined },
  isVerified:   { type: Boolean, default: false },
  views:        { type: Number, default: 0 },
  contactInfo: {
    name:       { type: String, default: '' },
    phone:      { type: String, default: '' },
    email:      { type: String, default: '' },
  },
  lastScrapedAt: { type: Date, default: null },
  investorData: {
    pricePerMarla: { type: Number, default: null },
    rentalYield:   { type: Number, default: null },
    areaUnit:      { type: String, default: 'marla' },
  },
}, { timestamps: true });

// Virtual for backward compatibility with routes expecting agent
PropertySchema.virtual('agent', {
  ref: 'User',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true
}).set(function(val) {
  this.agentId = val;
});

// Indexes for fast filtering
PropertySchema.index({ 'location.city': 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ purpose: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ lastScrapedAt: -1 });
PropertySchema.index({ sourceUrl: 1 }, { sparse: true });

// Configure serialization to include virtuals
PropertySchema.set('toJSON', { virtuals: true });
PropertySchema.set('toObject', { virtuals: true });

export default mongoose.models.Property || mongoose.model('Property', PropertySchema);
