import express from 'express';
import { getUser, logout } from '../controllers/users.js';

const router = express.Router();

// Route handler for getting user profile
router.get('/profile', getUser);

// POST /users/logout
// Route handler for logging out the user
router.get('/logout', logout);

export default router;
