import express from 'express';
import userRoutes from './users.js';
import authRoutes from './auth.js';
import { verifyToken, verifyToken200Status } from '../middleware/auth.js';

const router = express.Router();

// Mount the authentication routes at the /auth path
router.use('/auth', authRoutes);

// Mount the user routes at the /users path and add authentication middleware
router.use('/users', verifyToken, userRoutes);

// Mount the token verification routes at the /verify-token path and add token reload middleware which responds with 200 Status
router.use('/verify-token', verifyToken200Status, authRoutes);

export default router;
