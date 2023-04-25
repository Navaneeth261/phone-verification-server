import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({path:'.env'});

// Get the values of environment variables
export const NODE_ENV = process.env.NODE_ENV; // Environment in which the app is running (development, production, test)
export const PORT = process.env.PORT; // Port on which the app will run

export const MONGODB_URL = process.env.MONGODB_URL; // MongoDB connection URL
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(','); // Allowed origins for CORS
export const JWT_SECRET = process.env.JWT_SECRET; // Secret key used for JWT generation

export const HASH_VERIFICATION_CODE = process.env.HASH_VERIFICATION_CODE === 'true'; // Whether or not to hash the verification code
export const VERIFICATION_CODE_EXPIRE_IN_MINS = process.env.VERIFICATION_CODE_EXPIRE_IN_MINS; // Expiration time (in minutes) for verification codes
export const MAX_VERIFICATION_ATTEMPTS = process.env.MAX_VERIFICATION_ATTEMPTS; // Maximum number of attempts allowed for verification codes

export const AWS_ACCESS_KEY_ID = process.env.SNS_AWS_ACCESS_KEY_ID; // AWS Access Key ID for SNS service
export const AWS_SECRET_ACCESS_KEY = process.env.SNS_AWS_SECRET_ACCESS_KEY; // AWS Secret Access Key for SNS service
export const AWS_REGION = process.env.SNS_AWS_REGION; // AWS Region where SNS service is available
