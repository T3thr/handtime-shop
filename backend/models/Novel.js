// backend/models/Novel.js
import mongoose from 'mongoose';

const NovelSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  genre: { type: String,required: true, },
  author: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  viewCount: { type: Number, default: 0 }, // Initialize view count to 0
}, {
    timestamps: true, 
  });

const Novel = mongoose.models.Novel || mongoose.model('Novel', NovelSchema);
export default Novel;
