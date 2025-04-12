import mongoose, { Schema } from 'mongoose';

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      validate: {
        validator: function (v) {
          return v === null || /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: (props) => `${props.value} is not a valid image URL!`,
      },
    },
    variant: {
      color: String,
      size: String,
      sku: String,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      default: () =>
        `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    items: [OrderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery', 'line'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;