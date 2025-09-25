import mongoose, { Schema } from "mongoose";
import { UserType } from "../types/entityTypes";

/*
 ** fcm token schema
 */
const fcmTokenSchema = new Schema({
  fcmToken: { type: String, required: true },
  deviceId: { type: String, required: true },
});

/*
 ** User database schema
 */
const userSchema = new Schema<UserType>(
  {
    authId: {
      type: String,
      required: [true, "authId is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    profileImage: { type: String, default: "" },
    name: { type: String, default: "" },
    username: { type: String, default: "", unique: true, index: true },

    notification: {
      type: Boolean,
      required: [true, "notification is required"],
      default: true,
    },
    fcmTokens: {
      type: [fcmTokenSchema],
      default: [],
    },

    onlineStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Users = mongoose.model("Users", userSchema);
