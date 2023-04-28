import mongoose from 'mongoose';

const verificationObject = {
  _id: false,
  id: {
    type: Number,
    required: true,
  },
  code_type: {
    type: String,
    enum: ["Login", "Register"],
    required:true,
  },
  code: {
    type: String,
    required: true,
  },
  sentStatus: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  loggedOutAt: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
  }
};

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
    userStatus: {
      type: String,
      required: true,
    },
    verification: {
      type: verificationObject,
      required: true,
    },
    verificationHistory: {
      type: Map,
      of: verificationObject,
      default: new Map(),
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

