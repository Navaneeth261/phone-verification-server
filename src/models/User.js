import mongoose from "mongoose";
import { VERIFICATION_CODE_EXPIRE_IN_MINS } from "../config/env.js";

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    verificationCode: {
      type: String,
      required: true,
    },
    verificationCodeSentStatus: {
      type: Boolean,
      default: false,
    },
    verificationCodeExpiration: {
      type: Date,
      required: true,
      default: function () {
        // Set default expiration date
        return new Date(Date.now() + parseInt(VERIFICATION_CODE_EXPIRE_IN_MINS) * 60 * 1000);
      },
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastVerifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create a new model from the user schema and export it
export const User = mongoose.model("Users", userSchema);
