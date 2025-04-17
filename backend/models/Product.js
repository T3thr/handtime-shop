import mongoose, { Schema } from 'mongoose';

const ImageSchema = new Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
      },
      message: (props) => `${props.value} is not a valid image URL!`,
    },
  },
  public_id: String,
  alt: String,
});

const ReviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  images: [
    {
      type: String,
      validate: {
        validator: function (v) {
          return v === null || /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: (props) => `${props.value} is not a valid image URL!`,
      },
    },
  ],
  verifiedPurchase: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    images: [ImageSchema],
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    quantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    trackQuantity: {
      type: Boolean,
      default: true,
    },
    continueSellingWhenOutOfStock: {
      type: Boolean,
      default: false,
    },
    reviews: [ReviewSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Keep only necessary indexes
ProductSchema.index({ categories: 1, price: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;