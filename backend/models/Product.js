import mongoose, { Schema } from 'mongoose';

const VariantSchema = new Schema({
  name: { type: String, required: true, trim: true },
  options: [{
    value: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    priceAdjustment: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
  }],
}, { _id: false });

const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 100 },
  comment: { type: String, trim: true, maxlength: 500 },
  images: [{
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/.test(v);
      },
      message: (props) => `${props.value} is not a valid image URL!`,
    },
  }],
  likes: { type: Number, default: 0, min: 0 },
  dislikes: { type: Number, default: 0, min: 0 },
  verifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  shortDescription: { type: String, trim: true, maxlength: 300 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function (v) {
        return v == null || v > this.price;
      },
      message: 'Compare price must be greater than current price',
    },
  },
  costPerItem: { type: Number, min: 0 },
  sku: { type: String, trim: true, uppercase: true },
  barcode: { type: String, trim: true },
  trackQuantity: { type: Boolean, default: true },
  quantity: { type: Number, default: 0, min: 0 },
  continueSellingWhenOutOfStock: { type: Boolean, default: false },
  weight: { type: Number, min: 0 },
  weightUnit: { type: String, enum: ['g', 'kg', 'oz', 'lb'], default: 'g' },
  categories: [{ type: String, trim: true }], // Changed to array of strings for simplicity
  tags: [{ type: String, trim: true, lowercase: true }],
  images: [{
    url: {
      type: String,
      required: false,
      required: true,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/.test(v);
        },
        message: (props) => `${props.value} is not a valid image URL!`,
      },
    },
    altText: { type: String, trim: true, maxlength: 100 },
    isPrimary: { type: Boolean, default: false },
  }],
  variants: [VariantSchema],
  reviews: [ReviewSchema],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
  seoTitle: { type: String, trim: true, maxlength: 70 },
  seoDescription: { type: String, trim: true, maxlength: 160 },
  vendor: { type: String, trim: true },
  type: { type: String, trim: true },
  metadata: { type: Map, of: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ status: 1 });

ProductSchema.virtual('primaryImage').get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary ? primary.url : (this.images[0]?.url || '');
});

ProductSchema.pre('save', function (next) {
  if (this.reviews && this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = parseFloat((total / this.reviews.length).toFixed(1));
    this.reviewCount = this.reviews.length;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
  next();
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;