import express from 'express';
import { getUser } from '../controllers/users.js';

const router = express.Router();

// Route handler for getting user profile
router.get('/profile', getUser);

export default router;
