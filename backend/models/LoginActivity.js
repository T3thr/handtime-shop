// backend/models/LoginActivity.js
import mongoose from 'mongoose';

const LoginActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User',
    },
    googleUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'GoogleUser',
    },
    name: {
        type: String,
        required: [false, "Please enter your name"],
      },
    username: {
        type: String, 
        required: false,
    },
    email: { 
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: [false, "Please enter your password"],
        minLength: [6, "Your password must be longer than 6 characters"],
        select: false,
      },
    role: {
        type: String,
        default: "user",
        required: false,
    },
    ipAddress: {
        type: String,
        required: false,
    },
    lastLogin: { type: Date, required: false},
    },
);

const LoginActivity = mongoose.models?.LoginActivity || mongoose.model('LoginActivity', LoginActivitySchema);

export default LoginActivity;
