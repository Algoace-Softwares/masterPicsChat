/* eslint-disable @typescript-eslint/no-explicit-any */
import { messaging } from "firebase-admin";
import { Types } from "mongoose";
import { Users } from "../models/user.models";
import { UserType } from "../types/entityTypes";

export class CommonUtils {
  /*
   ** Get unique array - remove duplicates
   */
  uniqueArray = <T>(array: T[]): T[] => {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  };
  /*
   ** Shuffle arrays
   */
  shuffleArray = <T>(array: T[]): T[] => {
    let currentIndex = array.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };
  /*
   **
   To title case
   */
  toTitleCase = (text = "", allWords = false) => {
    if (allWords) {
      return text
        .split(" ")
        .map((item) => item[0].toUpperCase() + item.substring(1, item.length))
        .join(" ");
    }
    return text[0].toUpperCase() + text.substring(1, text.length);
  };
  /*
   **get unique object make array into object key value pair key would be the id
   */
  getUniqueObject = <T, Key extends keyof T>(data: T[], keyName: Key): Record<Key, T> => {
    const newData = {} as Record<Key, T>;
    data.forEach((item: T) => {
      newData[item[keyName] as Key] = { ...item };
    });
    return newData;
  };
  /*
   ** generating temp password
   */
  generateTempPass = (): string => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };
  /*
   ** Sending push notifications by firbase
   */
  sendPushNotification = async (
    user: UserType,
    title: string,
    body: string,
    chatRoomId: string,
    senderData: { username: string; profileImage: string; _id: string },
  ) => {
    // Ensure the user exists and has FCM tokens
    if (user && user.fcmTokens.length > 0) {
      const fcmTokens = user.fcmTokens.map((token) => token.fcmToken);
      console.log("🚀 ~ fcmTokens:", fcmTokens);

      // Prepare the notification payload for FCM
      const message = {
        notification: {
          title: title || "You have a new notification",
          body: body,
        },
        // Adding notificationType to custom data
        // Adding referenceId as string (since it's an ObjectId)
        data: {
          notificationType: "CHAT_MESSAGE",
          chatRoomId: chatRoomId,
          senderName: senderData?.username,
          senderImage: senderData?.profileImage,
          senderId: senderData?._id,
        },
        // Send notification to all of the user's registered devices
        tokens: fcmTokens,
      };

      // Send notification via Firebase Admin SDK
      try {
        const response = await messaging().sendMulticast(message);
        console.log(`Successfully sent ${response.responses} notifications`);
      } catch (error) {
        console.error("Error sending FCM notification:", error);
      }
    }
  };
}

export class AppUtils extends CommonUtils {
  constructor() {
    super();
  }
  /*
   ** Verifying cognito token
   */
  // verifyCognitoToken = async (token: string, group?: string): Promise<CognitoAccessTokenPayload | undefined> => {
  //   try {
  //     // creating instace to verify token
  //     const verifier = CognitoJwtVerifier.create({
  //       userPoolId: USER_POOL_ID as string,
  //       tokenUse: "access",
  //       groups: group ? group : undefined,
  //       clientId: CLIENT_ID as string,
  //       includeRawJwtInErrors: true,
  //     });

  //     // verifying token
  //     const userData = await verifier.verify(token);
  //     return userData;
  //   } catch (error) {
  //     console.log("cognito verification failed", error);
  //     if (error instanceof JwtExpiredError) {
  //       throw new Error("Token Expired");
  //     } else {
  //       throw new Error("Token validation failed");
  //     }
  //   }
  // };
  /*
   ** Sending push notifications by firbase
   */
  sendMessageNotification = async (
    users: Types.ObjectId[],
    body: string,
    messageType: string,
    chatRoomId: string,
    senderName: string,
    senderProfile: string,
    senderId: string,
  ) => {
    if (!users?.length) {
      return;
    }
    /*
     ** Getting all users at once
     */
    const userDataList = await Users.find({ _id: { $in: users } });
    console.log("🚀 ~ AppUtils ~ userDataList:", userDataList);
    const promises: Promise<string>[] = [];

    userDataList.forEach((userData) => {
      console.log("🚀 ~ AppUtils ~ userDataList.forEach ~ userData:", userData);
      // skipping that user so that sender wont recive the notification
      if (userData?._id.toString() === senderId.toString()) {
        console.log("🚀 ~ AppUtils ~ userDataList.forEach ~ skipping user:", userData);
        return;
      }

      if (userData?.fcmTokens?.length > 0) {
        userData.fcmTokens.forEach((token) => {
          console.log("🚀 ~ AppUtils ~ userData.fcmTokens.forEach ~ token:", token);
          const message = {
            token: token.fcmToken as string,
            // Apple-specific settings for push notifications
            apns: {
              headers: {
                "apns-priority": "10",
              },
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
            // android specific settings
            android: {
              priority: "high",
              notification: {
                sound: "default",
                default_sound: true,
                default_vibrate_timings: true,
                notification_priority: "PRIORITY_HIGH",
              },
            },
            data: {
              notificationType: "NEW_MESSAGE",
              chatRoomId,
              senderName,
              senderProfile,
              senderId,
              messageType,
            },
            notification: { title: senderName, body },
          };
          console.log("🚀 ~ AppUtils ~ userData.fcmTokens.forEach ~ message:", message);

          promises.push(messaging().send(message as any));
        });
      }
    });

    try {
      console.log("🚀 ~ AppUtils ~ promises:", promises);
      const response = await Promise.allSettled(promises);
      console.log("🚀 ~ response:", response);
    } catch (error) {
      console.error("Error sending FCM notification:", error);
      throw new Error("Error sending FCM notification");
    }
  };

  /*
   ** Getting diff of days between two dates
   */
  getDateDiffInDays = (date1: Date, date2: Date) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
  };
  /*
   ** Getting unique data per day
   */
  getUniqueDataPerDay = (data: { createdAt: string }[]) => {
    // getting unique data on a single day
    const uniqueLogsByDate = new Map();
    data.forEach((log) => {
      const dateKey = log.createdAt.split("T")[0];
      if (!uniqueLogsByDate.has(dateKey)) {
        uniqueLogsByDate.set(dateKey, log);
      }
    });
    // Convert the map values back to an array if needed
    const uniqueLogsArray = Array.from(uniqueLogsByDate.values());
    return uniqueLogsArray;
  };
}
