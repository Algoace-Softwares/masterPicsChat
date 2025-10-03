import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
  searchUsers,
} from "../controllers/users.Controller";
import { checkSchemaError } from "../middleware/validations";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  searchUsersSchema,
  pageLimitSchema,
} from "../middleware/schemas/requestSchemas";

// DEFINE EXPRESS ROUTES
const router = express.Router();

/*
 ** USER CRUD ROUTES
 */

// Create a new user
router.route("/").post(createUserSchema, checkSchemaError, createUser);

// Get all users with pagination
router.route("/").get(pageLimitSchema, checkSchemaError, getAllUsers);

// Search users by name, username, or email
router.route("/search").get(searchUsersSchema, checkSchemaError, searchUsers);
/*
 ** Update user
 */

// Get user by ID
// router.route("/:userId").get(getUserById);
router.route("/:userId").get(userIdSchema, checkSchemaError, getUserById);

// Update user by ID
router.route("/:userId").patch(userIdSchema, updateUserSchema, checkSchemaError, updateUser);

// Delete user by ID
router.route("/:userId").delete(userIdSchema, checkSchemaError, deleteUser);

export default router;
