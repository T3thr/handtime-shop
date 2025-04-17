import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
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
      default: '',
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['show', 'hide'],
      default: 'show',
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, productId: 1, orderId: 1 });
ReviewSchema.index({ status: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export default Review;