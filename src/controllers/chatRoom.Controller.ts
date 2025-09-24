import { Request, Response } from "express";
import { Types } from "mongoose";
import logger from "../utils/logger";
import { ChatRoom } from "../models/chatRoom.model";
import { formatedError } from "../utils/formatedError";
import { Users } from "../models/user.models";
import { ChatEventEnum, STATUS_CODE } from "../config";
import { ChatMessage } from "../models/chatMessage.model";
import { emitSocketEvent } from "../socket";
import { commonoUtils } from "../utils";
/*
 ** Creating a one to one chat room
 **
 */
const createChatRoom = async (req: Request, res: Response) => {
  const { member, createdBy, text, messageType, audio, video, image } = req.body;
  try {
    // vaidating member and createdBy user
    if (member === createdBy) {
      return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({ success: false, message: "You cannot chat with yourself" });
    }
    // validation user
    const createrData = await Users.findOne({ _id: createdBy });
    if (!createrData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "CreatedBy user not found" });
    }
    // validating member data
    const memberData = await Users.findOne({ _id: member });
    if (!memberData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "member not found" });
    }



    // checking if chat room is already created by these two participant
    const chatRoom = await ChatRoom.findOne({
      isGroupChat: false,
      members: {
        $all: [member, createdBy],
      },
    });

    console.log("🚀 ~ createChatRoom ~ chatRoom:", chatRoom);
    if (chatRoom) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({ success: false, message: "Chat is already created" });
    }

    // Create a one on one chat room
    const newChatRoom = await ChatRoom.create({
      isGroupChat: false,
      admins: [createdBy],
      members: [member, createdBy],
      unreadUserCount: [
        { memberId: member, count: 0 },
        { memberId: createdBy, count: 0 },
      ],
      createdBy,
      lastMessage: undefined,
    });
    console.log("🚀 ~ createChatRoom ~ newChatRoom:", newChatRoom);
    if (text || audio || video || image) {
      // creaing message
      const newMessage = await ChatMessage.create({
        chatRoom: newChatRoom?._id,
        user: createdBy,
        text,
        messageType,
        audio: audio || undefined,
        video: video || undefined,
        image: image || undefined,
      });
      // TODO: handle it properly read/unread flow

      // updating unread count
      const updatedChatRoom = await ChatRoom.findOneAndUpdate(
        { _id: newChatRoom?._id, "unreadUserCount.memberId": member },
        {
          $set: { lastMessage: newMessage._id },
          $inc: { "unreadUserCount.$.count": 1 },
        },
        { new: true, runValidators: true },
      )
        .populate({
          path: "members",
          select: "name nickName profileImage email",
        })
        .populate({
          path: "lastMessage",
          select: "text messageType createdAt",
        });
      console.log("updated data is:", updatedChatRoom);
      // getting chat room
      // sending push notifications
      await commonoUtils.sendPushNotification(memberData, "New message", "Text message", newChatRoom?._id, {
        username: createrData?.username,
        profileImage: createrData?.profileImage,
        _id: createrData?._id,
      });

      // console.log("🚀 ~ sendMessage ~ messageWithUserData:", messageWithUserData);
      // logic to emit socket event about the new group chat added to the participants
      emitSocketEvent(req, member, ChatEventEnum.NEW_CHAT_EVENT, updatedChatRoom);
    }

    return res.status(STATUS_CODE.CREATED).json({ success: true, data: newChatRoom });
  } catch (error) {
    console.log("🚀 ~ createGroupChat ~ error:", error);
    logger.error("Error creating chat room:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Controller for updating user online status
 */
const updateUserOnlineStatus = async (req: Request, res: Response) => {
  const memberId = req.params.memberId;
  const { onlineStatus } = req.body;

  try {
    // Update the user's online status in the database
    await Users.findByIdAndUpdate(memberId, { onlineStatus });

    // Get the list of chat rooms the user is currently a member of
    const chatRooms = await ChatRoom.find({ members: memberId });

    // Emit online status change event to all rooms the user is a member of
    chatRooms.forEach((room) => {
      emitSocketEvent(req, room._id.toString(), ChatEventEnum.USER_ONLINE_STATUS_EVENT, {
        memberId,
        chatId: room?._id,
        onlineStatus: onlineStatus === "ONLINE" ? true : false,
      });
    });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, message: "Status updated and events emitted." });
  } catch (error) {
    console.log("🚀 ~ updateUserStatus ~ error:", error);
    logger.error("Unable to update user status:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Getting user all chat rooms
 */
const getUserChatRooms = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    // getting total counts
    const totalChatRooms = await ChatRoom.countDocuments({
      members: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } },
    });
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalChatRooms / limit);
    // getting all user chat box
    const chats = await ChatRoom.find({ members: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } } })
      .sort({ updatedAt: -1 })
      .populate({
        path: "members",
        select: "name nickName profileImage email",
      })
      .populate({
        path: "lastMessage",
        select: "text messageType createdAt",
      })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: chats,
      },
    });
  } catch (error) {
    logger.error("Unable to get user chat rooms:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Reseting chatRoom unread count
 */
const resetUnreadCount = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.params;

  try {
    // checking if roo exits or not
    const chatRoomData = await ChatRoom.findById(chatRoomId);
    if (!chatRoomData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }
    // UPDATE unread count on chat
    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: chatRoomId, "unreadUserCount.memberId": memberId },
      { $set: { "unreadUserCount.$.count": 0 } },
      { new: true, runValidators: true, timestamps: false },
    )
      .populate({
        path: "members",
        select: "name nickName profileImage email",
      })
      .populate({
        path: "lastMessage",
        select: "text messageType createdAt",
      });

    console.log("🚀 ~ resetUnreadCount ~ updateInbox:", updateInbox);

    return res.status(200).json({ success: true, data: updateInbox });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Unable to reset unread count", error);

    return res.status(400).json({ error: true, message: "Error resetting unread count" });
  }
};
/*
 ** Getting chat room by userIds
 */
const getChatByUserIds = async (req: Request, res: Response) => {
  const { firstUser, secondUser } = req.query;

  try {
    const isChatRoom = await ChatRoom.findOne({
      isGroupChat: false,
      members: {
        $all: [new Types.ObjectId(firstUser as string), new Types.ObjectId(secondUser as string)],
      },
    });
    console.log("🚀 ~ getChatByUserIds ~ updateInbox:", isChatRoom);

    return res.status(200).json({ success: true, data: isChatRoom });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("unable to get chat by user ids", error);

    return res.status(400).json({ error: true, message: "Unable to get chat room" });
  }
};
/*
 ** Getting chat room by chatid
 */
const getChatByChatId = async (req: Request, res: Response) => {
  const chatRoomId = req.params.chatRoomId;

  try {
    // Find chat room by chat id
    const chatRoom = await ChatRoom.findById(chatRoomId);

    return res.status(200).json({ success: true, data: chatRoom });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("unbale to get chat by chat id", error);

    return res.status(400).json({ error: true, message: "Error getting inboxId" });
  }
};
/*
 ** getting chat all messages
 */
const getChatMessages = async (req: Request, res: Response) => {
  const chatRoomId = req.params.chatRoomId;
  const memberId = req.params.memberId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      members: { $elemMatch: { $eq: new Types.ObjectId(memberId as string) } },
    });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room  not found" });
    }
    // getting total counts
    const totalMessages = await ChatMessage.countDocuments({ chatRoom: chatRoomId });
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalMessages / limit);
    const messages = await ChatMessage.find({ chatRoom: chatRoomId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "name nickName profileImage email",
      })
      .skip((page - 1) * limit)
      .limit(limit);
    console.log("🚀 ~ getChatMessages ~ messages:", messages);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: messages,
      },
    });
  } catch (error) {
    console.log("🚀 ~ getChatMessages ~ error:", error);
    logger.error("Unable to get chat messages:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Deleting one to one chat
 */
const deleteChatRoom = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: false });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }

    // validating if user is room admin or not
    if (!chatRoom?.members?.includes(new Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only members are allowed to delete this chat room" });
    }

    // delete the chat even if user is not admin because it's a personal chat
    // await deleteChatRoomById(chatRoomId);
    // deleteing all  user message in that chat room
    await ChatMessage.deleteMany({ chatRoom: chatRoomId, user: memberId });

    // checking if user exits then pull that user if there is only single user so delete the while chat
    if (chatRoom?.members.length > 1) {
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        $pull: { members: memberId },
      });
    } else {
      await ChatRoom.findByIdAndDelete(chatRoomId);
    }

    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    console.log("🚀 ~ deleteGroupChat ~ error:", error);
    logger.error("Unable to delete chat room:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** getting user all unread count
 */
const getUnreadCountForUser = async (req: Request, res: Response) => {
  const { memberId } = req.params;

  try {
    // Fetch all chat rooms where the memberId is part of the unreadUserCount array
    const chatRooms = await ChatRoom.find({
      members: { $elemMatch: { $eq: new Types.ObjectId(memberId as string) } },
    }).select("roomName unreadUserCount");

    let unReadCount = 0;
    // loop  through the whole data
    chatRooms.forEach((chatRoom) => {
      console.log("🚀 ~ unreadCounts ~ chatRoom:", chatRoom);
      // Extracting unread counts for the user
      const unReadCountUser = chatRoom.unreadUserCount.find((user) => user.memberId.toString() === memberId);
      // console.log("🚀 ~ chatRooms.forEach ~ unReadCountUser:", unReadCountUser);
      // adding it into un readcount
      if (unReadCountUser) {
        unReadCount = unReadCount + unReadCountUser?.count;
      }
    });

    return res.status(200).json({ success: true, data: unReadCount });
  } catch (error) {
    // Handle error and log it
    logger.error("Error fetching unread counts for user", error);
    return res.status(400).json({ error: true, message: "Error fetching unread counts" });
  }
};

export {
  getUserChatRooms,
  resetUnreadCount,
  getChatMessages,
  getChatByUserIds,
  createChatRoom,
  deleteChatRoom,
  getChatByChatId,
  updateUserOnlineStatus,
  getUnreadCountForUser,
};
