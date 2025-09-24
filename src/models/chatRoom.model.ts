import mongoose, { Schema } from "mongoose";
import { chatRoomType } from "../types/entityTypes";
// import { Users } from "./user.models";

const chatRoomSchema = new Schema<chatRoomType>(
  {
    roomName: {
      type: String,
      default: "",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      validate: {
        validator: function (members: Schema.Types.ObjectId[]) {
          return members.length <= 20;
        },
        message: "A chat room cannot have more than 20 members.",
      },
    },
    unreadUserCount: {
      type: [
        {
          memberId: { type: Schema.Types.ObjectId, ref: "Users" },
          count: { type: Number, default: 0 },
        },
      ],
    },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      validate: {
        validator: function (admins: Schema.Types.ObjectId[]) {
          return admins.length <= 5;
        },
        message: "A chat room cannot have more than 5 admins.",
      },
    },
    profileImage: {
      type: String,
      default: "",
    },
    roomPrivacy: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
    },
  },
  { timestamps: true },
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
