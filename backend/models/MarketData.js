import mongoose from 'mongoose';

const AreaBreakdownSchema = new mongoose.Schema({
  area: { type: String },
  avgPrice: { type: Number },
  avgPricePerMarla: { type: Number },
  listingCount: { type: Number },
}, { _id: false });

const MarketDataSchema = new mongoose.Schema({
  city: { type: String, required: true, unique: true },
  totalListings: { type: Number, default: 0 },
  saleListings: { type: Number, default: 0 },
  rentListings: { type: Number, default: 0 },
  avgSalePrice: { type: Number, default: 0 },
  avgRentPrice: { type: Number, default: null },
  rentalYield: { type: Number, default: null },
  areaBreakdown: { type: [AreaBreakdownSchema], default: [] },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.MarketData ||
  mongoose.model('MarketData', MarketDataSchema);