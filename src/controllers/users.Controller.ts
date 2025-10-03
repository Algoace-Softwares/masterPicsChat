import { Request, Response } from "express";
import logger from "../utils/logger";
import { Users } from "../models/user.models";
import { formatedError } from "../utils/formatedError";
import { STATUS_CODE } from "../config";
//   http://localhost:3000/api/v1/
/*
 ** Create a new user
 */
const createUser = async (req: Request, res: Response) => {
  const { authId, email, name, username, notification = true, fcmToken = [] } = req.body;
  console.log("🚀 ~ createUser ~ req.body:", req.body);

  try {
    // Check if user with email already exists
    const existingUserByEmail = await Users.findOne({ email });
    if (existingUserByEmail) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if user with authId already exists
    const existingUserByAuthId = await Users.findOne({ authId });
    if (existingUserByAuthId) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({
        success: false,
        message: "User with this authId already exists",
      });
    }

    // Check if username is taken (if provided)
    if (username) {
      const existingUserByUsername = await Users.findOne({ username });
      if (existingUserByUsername) {
        return res.status(STATUS_CODE.CONFLICT_DATA).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    // Create new user
    const newUser = await Users.create({
      authId,
      email,
      name,
      username,
      notification,
      onlineStatus: false,
      fcmTokens: fcmToken,
    });

    logger.info(`New user created: ${newUser._id}`);

    return res.status(STATUS_CODE.CREATED).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    logger.error("Error creating user:", error);
    return formatedError(res, error);
  }
};

/*
 ** Get all users with pagination
 */
const getAllUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    // Get total count
    const totalUsers = await Users.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with pagination
    const users = await Users.find()
      .select("-fcmTokens") // Exclude sensitive data
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        totalUsers,
        items: users,
      },
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    return formatedError(res, error);
  }
};

/*
 ** Get user by ID
 */
const getUserById = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await Users.findOne({ authId: userId }).select("-fcmTokens");
    console.log("🚀 ~ getUserById ~ user:", user);

    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Error fetching user by ID:", error);
    return formatedError(res, error);
  }
};

/*
 ** Update user by ID
 */
const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name,   notification, profileImage, fcmToken, deviceId, isFcmUpdate } = req.body;
  console.log("🚀 ~ updateUser ~ req.body:", req.body);
  try {
    // Check if user exists
    const userData = await Users.findOne({ authId: userId });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    let tempFcmTokens = [];

    if (isFcmUpdate) {
      // filtering data to data the previous added token on device id
      tempFcmTokens = userData.fcmTokens.filter((fcm) => fcm.deviceId !== deviceId);
      // pusing new token
      tempFcmTokens.push({ deviceId, fcmToken });
    } else {
      // getting all token other then privided device id
      tempFcmTokens = userData.fcmTokens.filter((fcm) => fcm.deviceId !== deviceId);
    }



    // Update user
    const updatedUser = await Users.findByIdAndUpdate(
      userData._id,
      {
        name,
        profileImage,
        notification,
        fcmTokens: tempFcmTokens,
      },
      { new: true, runValidators: true },
    )

    logger.info(`User updated: ${userId}`);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user:", error);
    return formatedError(res, error);
  }
};


/*
 ** Search users by name, username, or email
 */
const searchUsers = async (req: Request, res: Response) => {
  const { query, page = 1, limit = 10 } = req.query;
  const searchQuery = query as string;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    // Create search regex
    const searchRegex = new RegExp(searchQuery.trim(), "i");

    // Build search criteria
    const searchCriteria = {
      $or: [
        { name: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    };

    // Get total count
    const totalUsers = await Users.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Get users with pagination
    const users = await Users.find(searchCriteria)
      .select("-fcmTokens")
      .sort({ name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page: pageNum,
        limit: limitNum,
        totalUsers,
        query: searchQuery,
        items: users,
      },
    });
  } catch (error) {
    logger.error("Error searching users:", error);
    return formatedError(res, error);
  }
};

/*
 ** Delete user by ID
 */
const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await Users.findByIdAndDelete(userId);

    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info(`User deleted: ${userId}`);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user:", error);
    return formatedError(res, error);
  }
};
/*
 ** updating user fcm token
 */
const updateUserFcm = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { fcmToken, deviceId, isFcmUpdate } = req.body;

  try {
    // validation user
    const userData = await Users.findOne({ authId: userId });
    console.log("🚀 ~ updateUserFcm ~ userData:", userData);
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user with authId not found" });
    }
    let tempFcmTokens = [];

    if (isFcmUpdate) {
      // filtering data to data the previous added token on device id
      tempFcmTokens = userData.fcmTokens.filter((fcm) => fcm.deviceId !== deviceId);
      // pusing new token
      tempFcmTokens.push({ deviceId, fcmToken });
    } else {
      // getting all token other then privided device id
      tempFcmTokens = userData.fcmTokens.filter((fcm) => fcm.deviceId !== deviceId);
    }
    console.log("tempFcmTokens:", tempFcmTokens);
    // saving tokens
    await Users.findOneAndUpdate(
      { authId: userId },
      {
        fcmTokens: tempFcmTokens,
      },
      { new: true, runValidators: true },
    );
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, message: "Token successfully updated" });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserData ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export { createUser, getAllUsers, getUserById, updateUser,  searchUsers, deleteUser, updateUserFcm };
