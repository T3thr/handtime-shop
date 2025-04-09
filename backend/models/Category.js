import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      url: String,
      public_id: String,
    },
    priority: {
      type: String,
      enum: ["main", "normal"],
      default: "normal",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Add indexes for better performance
categorySchema.index({ name: 1, slug: 1, priority: 1 });

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;