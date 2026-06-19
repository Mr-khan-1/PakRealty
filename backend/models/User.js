import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name:         { type: String,  required: true,  trim: true },
  email:        { type: String,  required: true,  unique: true, lowercase: true, trim: true },
  passwordHash: { type: String,  required: true },
  role:         { type: String,  enum: ['user', 'agent', 'investor', 'admin'], default: 'user' },
  phone:        { type: String,  default: '' },
  avatar:       { type: String,  default: '' },
  isActive:     { type: Boolean, default: true },
  // Compatibility field for favorites
  savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: [] }],
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Virtuals for backward compatibility with routes expecting firstName, lastName, and password
UserSchema.virtual('firstName').get(function() {
  return this.name ? this.name.split(' ')[0] : '';
}).set(function(val) {
  const parts = this.name ? this.name.split(' ') : [];
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  this.name = `${val} ${lastName}`.trim();
});

UserSchema.virtual('lastName').get(function() {
  const parts = this.name ? this.name.split(' ') : [];
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}).set(function(val) {
  const firstName = this.name ? this.name.split(' ')[0] : '';
  this.name = `${firstName} ${val}`.trim();
});

UserSchema.virtual('password').get(function() {
  return this.passwordHash;
}).set(function(val) {
  this.passwordHash = val;
});

// Configure serialization to include virtuals
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

UserSchema.set('toObject', {
  virtuals: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
