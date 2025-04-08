import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  image: {
    url: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/).+\.(jpg|jpeg|png|webp|gif)$/.test(v);
        },
        message: (props) => `${props.value} is not a valid image URL!`,
      },
    },
    altText: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
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

CategorySchema.index({ name: 'text', description: 'text' });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export default Category;