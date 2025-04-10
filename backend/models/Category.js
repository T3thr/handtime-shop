import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a category name"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Please provide a category slug"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    priority: {
      type: String,
      enum: ["main", "normal"],
      default: "normal",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

CategorySchema.pre("save", async function (next) {
  if (this.priority === "main" && this.isNew) {
    const mainCount = await mongoose.model("Category").countDocuments({ priority: "main" });
    if (mainCount >= 4) {
      return next(new Error("Cannot have more than 4 categories with 'main' priority."));
    }
  }
  next();
});

CategorySchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.priority === "main") {
    const existingCategory = await this.model.findOne(this.getQuery());
    if (!existingCategory || existingCategory.priority !== "main") {
      const mainCount = await this.model.countDocuments({ priority: "main" });
      if (mainCount >= 4) {
        return next(new Error("Cannot have more than 4 categories with 'main' priority."));
      }
    }
  }
  next();
});

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);