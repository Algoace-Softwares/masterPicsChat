import express, { Express, Request, Response, json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import { Server as SocketServer } from "socket.io";
import { initializeSocketIO } from "./socket";
import { rateLimit } from "express-rate-limit";
import { getApps } from "firebase-admin/app";
import * as admin from "firebase-admin";
import firebaseKey from "./config/firebaseKey.json";
import cors from "cors";
import { createServer } from "http";
import chatApis from "./routes/chatRoutes";
import userApis from "./routes/userRoutes";
import logger from "./utils/logger";
import morgan from "morgan";

const app: Express = express();
const httpServer = createServer(app);
const alreadyCreatedAps = getApps();

const firebaseApp =
  alreadyCreatedAps.length === 0
    ? admin.initializeApp({
        credential: admin.credential.cert(firebaseKey as unknown as string),
      })
    : alreadyCreatedAps[0];

const morganFormat = ":method :url :status :response-time ms";



const limiter = rateLimit({
  // 1 minutes
  windowMs: 1 * 60 * 1000,
  // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  max: 5000,
  // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  limit: 50,
  // Return rate limit info in the `RateLimit-*` headers
  standardHeaders: true,
  // Disable the `X-RateLimit-*` headers
  legacyHeaders: false,
});
/*
 ** Middlewares
 */
app.use(limiter);
app.use(cors());
app.use(json());
app.use(cookieParser());
app.use(urlencoded({ limit: "100mb", extended: true, parameterLimit: 50000 }));
/*
 ** logging format
 */
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);
/*
 ** Socket server
 */
const ioClient = new SocketServer(httpServer, {
  pingTimeout: 60000,
  connectionStateRecovery: {},
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("ioClient", ioClient);
/*
 ** Setting custom variables
 */
app.set("firebaseClient", firebaseApp);
app.get("/", (req: Request, res: Response) => {
  console.log("🚀 ~ res:", res);
  console.log("🚀 ~ req:", req);
  return res.status(200).json({ success: true, greeting: "Hello / from API" });
});
/*
 ** Routers
 */
app.use("/api/v1/chat", chatApis);
app.use("/api/v1/users", userApis);
/*
 ** Socket client initializer
 */
initializeSocketIO(ioClient);
/*
 ** Middleware to return response of URL NOT FOUND
 */
app.use((req: Request, res: Response) => {
  console.log("🚀 ~ app.use ~ res:", res);
  console.log("🚀 ~ app.use ~ req:", req);
  return res.status(404).json({
    error: true,
    message: "route not found",
  });
});

export { httpServer };


