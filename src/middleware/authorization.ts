import cookie from "cookie";
import { Socket } from "socket.io";
import { Users } from "../models/user.models";


/*
 ** Authntication connectiong user
 */
export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Parse cookies from the handshake headers
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    let token = cookies?.accessToken;

    // If no token in cookies, check the handshake auth
    if (!token) {
      token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    }

    // If no token is found, return an error
    if (!token) {
      return next(new Error("Unauthorized handshake: Token is missing"));
    }
    // Verify the token using your utility function
    // const tokenData = await appUtils.verifyCognitoToken(token);

      // Check if the user exists in the database
      const isUser = await Users.findOne({ cognitoId: 'dfdfdf' });
      if (!isUser) {
        return next(new Error("Unauthorized handshake: Token user not found"));
      }
      // Attach the full user data to `socket.data`
      socket.data.user = {
        _id: isUser._id,
        name: isUser.name,
        username: isUser.username,
        email: isUser.email,
        authId: isUser?.authId,
        profileImage: isUser?.profileImage,
      };
      return next();
    

  } catch (error) {
    console.log("🚀 ~ socketAuthMiddleware ~ error:", error);
    return next(new Error("User unauthorized"));
  }
};
