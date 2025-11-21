import { checkSchema, ParamSchema } from "express-validator";
import { bsonIdSchema, messageMediaType, numberValueSchema, textSchema, urlSchema } from "../../utils/commonSchemas";
import { Types } from "mongoose";
/*
 ** Create user request schema
 */
export const createChatRoomSchema = checkSchema({
  member: bsonIdSchema({ label: "member" }) as unknown as ParamSchema,
  createdBy: bsonIdSchema({ label: "createdBy" }) as unknown as ParamSchema,
  messageType: messageMediaType({ label: "messageType", required: false }) as unknown as ParamSchema,
  text: textSchema({ label: "text", required: false, maxLength: 500 }) as unknown as ParamSchema,
  image: urlSchema({ label: "image", required: false }) as unknown as ParamSchema,
  video: urlSchema({ label: "video", required: false }) as unknown as ParamSchema,
  audio: urlSchema({ label: "audio", required: false }) as unknown as ParamSchema,
});
/*
 ** get user chat room schema
 */
export const pageLimitSchema = checkSchema({
  page: numberValueSchema({ label: "page", min: 1, dataIn: "query" }) as unknown as ParamSchema,
  limit: numberValueSchema({ label: "limit", min: 5, max: 500, dataIn: "query" }) as unknown as ParamSchema,
});
/*
 ** toggling user status as online offline status
 */
export const toggleUserStatusSchema = checkSchema({
  onlineStatus: { in: ["body"], isBoolean: { errorMessage: "onlineStatus should be boolean" } },
});
/*
 ** is chat room exits schema
 */
export const isChatRoomSchema = checkSchema({
  firstUser: bsonIdSchema({ label: "firstUser", dataIn: "query" }) as unknown as ParamSchema,
  secondUser: bsonIdSchema({ label: "secondUser", dataIn: "query" }) as unknown as ParamSchema,
});
/*
 ** send message schema
 */
export const sendMessageSchema = checkSchema({
  memberId: bsonIdSchema({ label: "member" }) as unknown as ParamSchema,
  messageType: messageMediaType({ label: "messageType", required: false }) as unknown as ParamSchema,
  text: textSchema({ label: "text", required: false, maxLength: 1000 }) as unknown as ParamSchema,
  audio: urlSchema({ label: "audio", required: false }) as unknown as ParamSchema,
  video: urlSchema({ label: "video", required: false }) as unknown as ParamSchema,
  image: urlSchema({ label: "image", required: false }) as unknown as ParamSchema,
});
/*
 ** send message to bulk schema
 */
export const sendMessageBulkSchema = checkSchema({
  members: {
    in: ["body"],
    isArray: {
      errorMessage: "members must be an array",
    },
    custom: {
      options: (members: string[]) => {
        if (members.length === 0) {
          throw new Error("members array must include at least one item");
        }
        if (members.length > 10) {
          throw new Error("members cannot exceed 10");
        }
        for (const member of members) {
          if (!Types.ObjectId.isValid(member)) {
            throw new Error(`Invalid BSON ID: ${member}`);
          }
        }
        return true;
      },
    },
  },
  senderId: bsonIdSchema({ label: "senderId" }) as unknown as ParamSchema,
  messageType: messageMediaType({ label: "messageType", required: false }) as unknown as ParamSchema,
  text: textSchema({ label: "text", required: false, maxLength: 500 }) as unknown as ParamSchema,
  audio: urlSchema({ label: "audio", required: false }) as unknown as ParamSchema,
  video: urlSchema({ label: "video", required: false }) as unknown as ParamSchema,
  image: urlSchema({ label: "image", required: false }) as unknown as ParamSchema,
  postId: bsonIdSchema({ label: "member" }) as unknown as ParamSchema,
});

/*
 ** User CRUD Schemas
 */

// Create user schema
export const createUserSchema = checkSchema({
  authId: {
    in: ["body"],
    isString: { errorMessage: "authId must be a string" },
    notEmpty: { errorMessage: "authId is required" },
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: "authId must be between 1 and 100 characters",
    },
  },
  email: {
    in: ["body"],
    isEmail: { errorMessage: "Please provide a valid email" },
    notEmpty: { errorMessage: "email is required" },
  },
  name: {
    in: ["body"],
    isString: { errorMessage: "name must be a string" },
    optional: true,
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: "name must be between 1 and 100 characters",
    },
  },
  username: {
    in: ["body"],
    isString: { errorMessage: "username must be a string" },
    optional: true,
    isLength: {
      options: { min: 3, max: 30 },
      errorMessage: "username must be between 3 and 30 characters",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage: "username can only contain letters, numbers, and underscores",
    },
  },
  notification: {
    in: ["body"],
    isBoolean: { errorMessage: "notification must be a boolean" },
    optional: true,
  },
});

// Update user schema
export const updateUserSchema = checkSchema({
  name: {
    in: ["body"],
    isString: { errorMessage: "name must be a string" },
    optional: true,
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: "name must be between 1 and 100 characters",
    },
  },
  username: {
    in: ["body"],
    isString: { errorMessage: "username must be a string" },
    optional: true,
    isLength: {
      options: { min: 3, max: 30 },
      errorMessage: "username must be between 3 and 30 characters",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage: "username can only contain letters, numbers, and underscores",
    },
  },
  email: {
    in: ["body"],
    isEmail: { errorMessage: "Please provide a valid email" },
    optional: true,
  },
  notification: {
    in: ["body"],
    isBoolean: { errorMessage: "notification must be a boolean" },
    optional: true,
  },
  profileImage: {
    in: ["body"],
    isString: { errorMessage: "profileImage must be a string" },
    optional: true,
  },
});

// User ID schema
export const userIdSchema = checkSchema({
  userId: {
    in: ["params", "query", "body"], // adjust depending on where you send it
    isString: true,
    trim: true,
    notEmpty: {
      errorMessage: "userId is required",
    },
    errorMessage: "userId must be a string",
  },
});

// Search users schema
export const searchUsersSchema = checkSchema({
  query: {
    in: ["query"],
    isString: { errorMessage: "query must be a string" },
    notEmpty: { errorMessage: "search query is required" },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "search query must be between 2 and 50 characters",
    },
  },
  page: numberValueSchema({ label: "page", min: 1, dataIn: "query" }) as unknown as ParamSchema,
  limit: numberValueSchema({ label: "limit", min: 1, max: 100, dataIn: "query" }) as unknown as ParamSchema,
});

// Update user status schema
export const updateUserStatusSchema = checkSchema({
  onlineStatus: {
    in: ["body"],
    isBoolean: { errorMessage: "onlineStatus must be a boolean" },
    notEmpty: { errorMessage: "onlineStatus is required" },
  },
});

