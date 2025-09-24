import { Request } from "express";
import { API_BYPASS_KEY, ChatEventEnum } from "../config";
import { Server as SocketIOServer, Socket } from "socket.io";
import { socketAuthMiddleware } from "../middleware/authorization";
/*
 ** Registering to an event so can user can joing chat rooms
 */
const mountJoinChatEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, ({ chatId, userId }: { chatId: string; userId: string }) => {
    console.log(`${userId} joined the chat 🤝. chatId: `, chatId);
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
    socket.emit(ChatEventEnum.SERVER_MESSAGE, `${userId} have joined room with id ${chatId}`);
    // // Emit the message to the recipient's room
    // socket.to(chatId).emit(ChatEventEnum.USER_ONLINE_EVENT, {
    //   userId: socket.data.?user?._id,
    //   onlineStatus: true,
    // });
  });
};
/*
 ** Registering to an event so that users know about typing
 */
const mountParticipantTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.START_TYPING_EVENT, ({ chatId }: { chatId: string }) => {
    console.log("🚀 ~ socket.on ~ startyping:chatId:", chatId);
    // socket.in(chatId).emit(ChatEventEnum.START_TYPING_EVENT, chatId);
    socket.in(chatId).emit(ChatEventEnum.START_TYPING_EVENT, {
      userId: socket.data?.user?._id,
      name: socket.data?.user?.name,
      chatId: chatId,
    });
  });
};
/*
 ** Registering to an event so that users know about typing
 */
const mountParticipantStoppedTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, ({ chatId }: { chatId: string }) => {
    console.log("🚀 ~ socket.on ~stopTyping: chatId:", chatId);
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, {
      userId: socket.data?.user?._id,
      name: socket.data?.user?.name,
      chatId: chatId,
    });
  });
};
/*
 **  returing ioClinet
 */
const initializeSocketIO = (ioClient: SocketIOServer) => {
  /*
   ** Middleware to check if user is authorzied to connect or not
   ** if provide bypass key then bypass the user other wise authenticate user
   ** it will once every user is connected only
   */
  ioClient.use((socket, next) => {
    if (socket?.handshake?.headers?.authorization === API_BYPASS_KEY) {
      // if bypass key then setting random credential and hardcode ones
      socket.data.user = {
        _id: socket?.id,
        name: "shaheer",
      };
      next();
    } else {
      socketAuthMiddleware(socket, next);
    }
  });
  /*
   ** Event listners
   */
  ioClient.on(ChatEventEnum.CONNECTION_EVENT, async (socket: Socket) => {
    console.log("🚀 ~ ioClient.on ~ socket.data.user:", socket.data);
    const socketUser = socket.data?.user;
    try {
      socket.join(socketUser?._id?.toString());
      socket.emit(ChatEventEnum.SERVER_MESSAGE, "You have connected to server and ready to go. !!!!!");
      console.log(`User ${socketUser?._id?.toString()} connected with socket ID: ${socket.id}`);
      // Common events that needs to be mounted on the initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      // user send message
      socket.on(ChatEventEnum.MESSAGE, ({ message, userId }) => {
        console.log("🚀backend ~ socket.on ~ roomId:message", message, userId);

        // Emit the message to the recipient's room
        ioClient.to(userId).emit(ChatEventEnum.MESSAGE, {
          userId: socketUser?._id,
          message,
        });
      });

      // User leaves a room
      socket.on(ChatEventEnum.LEAVE_CHAT_EVENT, ({ chatId, userId }: { chatId: string; userId: string }) => {
        socket.leave(chatId);
        console.log(`User ${userId} left room: ${chatId}`);
        // emiting the user online status
        // socket.to(chatId).emit(ChatEventEnum.USER_OFFLINE_EVENT, {
        //   userId: socket.data?.user?._id,
        //   onlineStatus: true,
        // });
      });

      // Handle user disconnect
      socket.on(ChatEventEnum.DISCONNECT_EVENT, async () => {
        console.log("Client disconnected", socket.id);
        if (socketUser?._id) {
          socket.leave(socketUser?._id);
        }
      });
    } catch (error: unknown) {
      console.log("🚀 ~ returnioClient.on ~ error:", error);
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        (error as Error)?.message || "Something went wrong while connecting to the socket.",
      );
    }
  });
  return ioClient;
};

// Utility function responsible to abstract the logic of socket emission via the io instance
// and sending event into it
const emitSocketEvent = (req: Request, roomId: string, event: string, payload: string | object | unknown) => {
  req.app.get("ioClient").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent, socketAuthMiddleware };
