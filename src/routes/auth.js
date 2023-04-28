import express from 'express';
import { getRegisterCode, getLoginCode, registerWithCode, loginWithCode, verifyTokenResponse } from '../controllers/auth.js';

const router = express.Router();

// GET /auth
// Verify token response route
router.get('/', verifyTokenResponse);

// POST /auth/get-register-code
// Route handler for requesting a registration code
router.post('/get-register-code', getRegisterCode);

// POST /auth/get-login-code
// Route handler for requesting a login code
router.post('/get-login-code', getLoginCode);

// POST /auth/register-with-code
// Route handler for registering a new user with a code
router.post('/register-with-code', registerWithCode);

// POST /auth/login-with-code
// Route handler for logging in a user with a code
router.post('/login-with-code', loginWithCode);

export default router;
