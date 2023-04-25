import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser";

import { JWT_SECRET } from '../config/env.js';

export const verifyToken = async (req, res, next) => {
  try {
    // Parse the cookie from the request
    cookieParser()(req, res, () => {});

    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ success: false, message: "Access Denied. No JWT found in cookie" });
    }

    try {
      // Verify the token using the JWT_SECRET
      const verified = jwt.verify(token, JWT_SECRET);

      // If verification succeeds, decode the token and add the user details to the request body
      if (verified) {
        const { name, userId, phoneNumber } = jwt.decode(token, JWT_SECRET);

        req.body = {
          ...req.body,
          userId,
          phoneNumber,
          name,
        };

        // Call the next middleware in the chain
        return next();
      } else {
        // If verification fails, return a 401 error response
        return res.status(401).json({ success: false, message: "Access Denied. Reason: JWT not valid" });
      }

    } catch (err) {
      // If an error occurs during verification, return a 401 error response with the error message
      res.status(401).json({ success: false, message: `Access Denied. Reason: ${err.message}`, error: err.message });
    }

  } catch (err) {
    // If an internal server error occurs, return a 500 error response with the error message
    res.status(500).json({ success: false, message: "Internal server error. Please try again", error: err.message });
  }
};


// Middleware function to verify JWT token in the Authorization header
export const verifyToken1 = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ success: false, message: "Access Denied. No Authorization Header in Request" });
    }

    if (!token.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access Denied. Reason: Invalid Authorization Header Format. Missing Bearer Prefix" });
    }

    try {
      // Verify the token using the JWT_SECRET
      const verified = jwt.verify(token.slice(7), JWT_SECRET);

      // If verification succeeds, decode the token and add the user details to the request body
      if (verified) {
        const { name, userId, phoneNumber } = jwt.decode(token.slice(7), JWT_SECRET);

        req.body = {
          ...req.body,
          userId,
          phoneNumber,
          name,
        };

        // Call the next middleware in the chain
        return next();
      } else {
        // If verification fails, return a 401 error response
        return res.status(401).json({ success: false, message: "Access Denied. Reason: Authorization Header Not Valid" });
      }

    } catch (err) {
      // If an error occurs during verification, return a 401 error response with the error message
      res.status(401).json({ success: false, message: `Access Denied. Reason: ${err.message}`, error: err.message });
    }

  } catch (err) {
    // If an internal server error occurs, return a 500 error response with the error message
    res.status(500).json({ success: false, message: "Internal server error. Please try again", error: err.message });
  }
};

// Middleware function similar to verifyToken, but returns a 200 status code instead of 401 for unauthorized requests
export const verifyToken200Status = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(200).json({ success: false, message: "Auto Login Faild. No Authorization Header in Request" });
    }

    if (!token.startsWith("Bearer ")) {
      return res.status(200).json({ success: false, message: "Auto Login Failed. Invalid Authorization Header Format. Missing Bearer Prefix" });
    }

    try {
      // Verify the token using the JWT_SECRET
      const verified = jwt.verify(token.slice(7), JWT_SECRET);

      // If verification succeeds, decode the token and add the user details to the request body
      if (verified) {
        const { name, userId, phoneNumber } = jwt.decode(token.slice(7), JWT_SECRET);

        req.body = {
          ...req.body,
          userId,
          phoneNumber,
          name,
        };

        // Call the next middleware in the chain
        return next();
      } else {
        // If verification fails, return a 200 error response
        return res.status(200).json({ success: false, message: "Auto Loggin Failed. Authorization Header Not Valid" });
      }

    } catch (err) {
      // If an error occurs during verification, return a 200 error response with the error message
      res.status(200).json({ success: false, message: `Auto Login Failed. Reason: ${err.message}`, error: err.message });
    }

  } catch (err) {
    // If an internal server error occurs, return a 500 error response with the error message
    res.status(500).json( {success:false, message: "Internal server error. Please try again" , error: err.message });
  }
};
