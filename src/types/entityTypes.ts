import { Types } from "mongoose";
import { FcmTokenType } from "./appTypes";

export interface UserType {
  readonly _id?: string;
  readonly authId: string;
  readonly email: string;
  name: string;
  username: string;
  profileImage: string;
  notification: boolean;
  fcmTokens: FcmTokenType[];
  createdAt?: Date;
  updatedAt?: Date;
  lastSeenAt?: Date;
  onlineStatus: boolean;
}

export interface chatRoomType {
  readonly _id?: string;
  readonly createdBy: Types.ObjectId;
  admins: Types.ObjectId[];
  members: Types.ObjectId[];
  unreadUserCount: {
    memberId: Types.ObjectId;
    count: number;
  }[];
  isGroupChat: boolean;
  lastMessage: Types.ObjectId;
  roomName?: string;
  roomPrivacy: "PUBLIC" | "PRIVATE";
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface chatMessageType {
  readonly _id?: string;
  readonly chatRoom: Types.ObjectId;
  user: Types.ObjectId;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  audio?: string;
  image?: string;
  video?: string;
  media?: string;
  text: string;
  postId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  reactions: string[];
  edited?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
}

// export interface chatMessageType {
//   readonly _id?: string;
//   readonly chatRoom: Types.ObjectId;
//   user: Types.ObjectId;
//   messageType: "TEXT" | "IMAGE" | "VIDEO" | "VOICE" | "FILE";
//   image?: string;
//   video?: string;
//   audio?: string;
//   text: string;
//   updatedAt?: Date;
//   createdAt?: Date;
//   reactions: string[];
//   edited?: boolean;
//   sent?: boolean;
//   received?: boolean;
//   pending?: boolean;
// }
