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

ProductSchema.index({ slug: 1 });
ProductSchema.index({ categories: 1, price: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;