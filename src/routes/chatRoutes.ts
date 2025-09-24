import express from "express";
import {
  createChatRoom,
  deleteChatRoom,
  getChatByUserIds,
  getChatMessages,
  getUnreadCountForUser,
  getUserChatRooms,
  resetUnreadCount,
  updateUserOnlineStatus,
} from "../controllers/chatRoom.Controller";
import {
  deleteMessage,
  deleteUserMessages,
  editMessage,
  sendMessage,
  sendMessageToUsers,
} from "../controllers/chatMessages.Controller";

import { checkSchemaError } from "../middleware/validations";
import {
  createChatRoomSchema,
  isChatRoomSchema,
  pageLimitSchema,
  sendMessageBulkSchema,
  sendMessageSchema,
  toggleUserStatusSchema,
} from "../middleware/schemas/requestSchemas";

// DEFINE EXPRESS ROUTEs
const router = express.Router();
/*
 ** CHAT ROUTES
 *
 */
router.route("/").post(createChatRoomSchema, checkSchemaError, createChatRoom);
router.route("/:userId").get(pageLimitSchema, checkSchemaError, getUserChatRooms);
router.route("/").get(isChatRoomSchema, checkSchemaError, getChatByUserIds);
router.route("/user-messages/:chatRoomId/:memberId").delete(deleteUserMessages);
router.route("/count/:chatRoomId/:memberId").patch(resetUnreadCount);
router.route("/unread-total/:memberId").get(getUnreadCountForUser);
router.route("/messages/:chatRoomId/:memberId").get(pageLimitSchema, checkSchemaError, getChatMessages);
router.route("/:chatRoomId/:memberId").delete(deleteChatRoom);
router.route("/online-status/:memberId").patch(toggleUserStatusSchema, checkSchemaError, updateUserOnlineStatus);

/*
 ** Messages Routes
 */
router.route("/message/:chatRoomId").post(sendMessageSchema, checkSchemaError, sendMessage);
router.route("/messages").post(sendMessageBulkSchema, checkSchemaError, sendMessageToUsers);
router.route("/message/:messageId/:memberId").patch(checkSchemaError, editMessage);
router.route("/message/:messageId/:memberId").delete(deleteMessage);
router.route("/messages/:chatRoomId/:memberId").delete(deleteUserMessages);

export default router;
