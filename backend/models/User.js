// backend/models/User.js
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const CartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 99, default: 1 },
  image: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/.test(v),
      message: (props) => `${props.value} is not a valid image URL!`,
    },
  },
  addedAt: { type: Date, default: Date.now },
  variant: { color: String, size: String, sku: String },
}, { _id: false });

const WishlistItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  addedAt: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 200 },
}, { _id: false });

const AddressSchema = new Schema({
  recipientName: { type: String, required: true, trim: true, maxlength: 100 },
  street: { type: String, required: true, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  state: { type: String, trim: true, maxlength: 100 },
  postalCode: { type: String, required: true, trim: true, maxlength: 20 },
  country: { type: String, required: true, trim: true, maxlength: 100 },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(v),
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  isDefault: { type: Boolean, default: false },
  type: { type: String, enum: ["home", "work", "other"], default: "home" },
}, { _id: true });

const UserSchema = new Schema({
  lineId: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true, trim: true, minlength: 3, maxlength: 30 },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  password: { type: String, select: false, minlength: 8 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
  avatar: {
    type: String,
    validate: {
      validator: (v) => v === null || /^(https?:\/\/).+/.test(v),
      message: (props) => `${props.value} is not a valid image URL!`,
    },
    default: null,
  },
  cart: [CartItemSchema],
  wishlist: [WishlistItemSchema],
  addresses: [AddressSchema],
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  preferences: {
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    notifications: { email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderDate: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
});

UserSchema.pre("save", async function(next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.virtual("cartCount").get(function() {
  return this.cart.reduce((sum, item) => sum + item.quantity, 0);
});

UserSchema.virtual("wishlistCount").get(function() {
  return this.wishlist.length;
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;