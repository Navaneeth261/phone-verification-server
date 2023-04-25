// Import dependencies
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// Import environment variables
import {
  NODE_ENV,
  JWT_SECRET,
  VERIFICATION_CODE_EXPIRE_IN_MINS,
  MAX_VERIFICATION_ATTEMPTS,
  HASH_VERIFICATION_CODE,
} from "../config/env.js";

// Import local modules
import { User } from "../models/index.js";
import { validatePhoneNumber } from "../helpers/phoneNumberValidation.js";
import { sendVerificationCodeToPhoneNumber } from "../helpers/awsSnsHelper.js";

// Use a whitelist of allowed country codes instead of checking for a single country
// to allow for easier expansion in the future
const ALLOWED_COUNTRY_CODES = ["IN"];

// Create a middleware function that verifies the token and sends back the user information
export const verifyTokenResponse = async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Your Identity Verified and Auto-logged in",
    data: {
      userId: req.body.userId,
      phoneNumber: req.body.phoneNumber,
      name: req.body.name,
    },
  });
};

export const getRegisterCode = async (req, res) => {
  await generateVerificationCode(req, res, "register");
};

export const getLoginCode = async (req, res) => {
  await generateVerificationCode(req, res, "login");
};

export const registerWithCode = async (req, res) => {
  await verifyCode(req, res, "register");
};

export const loginWithCode = async (req, res) => {
  await verifyCode(req, res, "login");
};

export const logout = async (req, res) => {
  res.clearCookie('jwt'); // replace "cookieName" with the actual name of your cookie
  res.status(200).json({ message: "Logout successful" });
};

// Refactor the getRegisterCode and getLoginCode functions to reduce code duplication
const generateVerificationCode = async (req, res, action_type) => {
  try {
    const { countryCode: _countryCode, phoneNumber: _phoneNumber } = req.body;

    // Validate the phone number using a separate helper function
    const {
      isValid: phoneNumberIsValid,
      phoneNumber,
      countryIso2,
    } = validatePhoneNumber(`${_countryCode}${_phoneNumber}`);

    if (!phoneNumberIsValid) {
      res
        .status(200)
        .json({ status: false, message: "Please enter a valid phone number" });
      return;
    }

    // Check if the user exists in the database and whether the action is valid
    const user = await User.findOne({ phoneNumber }).maxTimeMS(20000);
    if (action_type === "register" && user && user.userId !== phoneNumber) {
      res.status(200).json({
        status: false,
        message: "User already registered. Please login to continue",
      });
      return;
    } else if (
      action_type === "login" &&
      (!user || user.userId === phoneNumber)
    ) {
      res.status(200).json({
        status: false,
        message:
          "This phone number not registered with us. Please register to continue",
      });
      return;
    }

    // Check if the country is allowed
    if (!ALLOWED_COUNTRY_CODES.includes(countryIso2)) {
      res.status(200).json({
        status: false,
        message: `Sorry, currenty we support only the following countries:  ${ALLOWED_COUNTRY_CODES.join(
          ", "
        )}`,
      });
      return;
    }

    // Generate a 6-digit verification code
    const _verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash the verification code if configured to do so in the environment variables
    let verificationCode;
    if (HASH_VERIFICATION_CODE) {
      const salt = await bcrypt.genSalt();
      verificationCode = await bcrypt.hash(_verificationCode, salt);
    }

    // set the verification code expiration time to 2 minutes from now
    const expirationTime = new Date();
    expirationTime.setMinutes(
      expirationTime.getMinutes() + VERIFICATION_CODE_EXPIRE_IN_MINS
    );

    //for development and testing purposes
    if (NODE_ENV === "development" || NODE_ENV === "test") {
      console.log(`Phone Number: ${_countryCode}${_phoneNumber}`);
      console.log(`Verification Code: ${_verificationCode}`);
    }

    // send the verification code via SMS
    const message = `Your one time verification code to ${action_type} is ${_verificationCode}. Valid for 2mins.`;
    let sendCodeRes;
    try {
      if (NODE_ENV === "development") {
        sendCodeRes = { status: true }; // use a dummy response for development purposes
      } else {
        sendCodeRes = await sendVerificationCodeToPhoneNumber(
          phoneNumber,
          message
        );
      }
    } catch (err) {
      sendCodeRes = {
        status: false,
        message: "Error sending SMS",
        error: err.message,
      };
    }

    if (action_type === "register") {
      // create the user in the database
      const user = await User.findOneAndUpdate(
        { phoneNumber },
        {
          name: "",
          userId: phoneNumber,
          phoneNumber,
          isVerified: false,
          verificationCode,
          verificationCodeSentStatus: sendCodeRes.status,
          verificationCodeExpiration: expirationTime,
          verificationAttempts: 0,
        },
        { upsert: true, new: true }
      );
    } else if (action_type === "login") {
      // update the user in the database
      user.isVerified = false;
      user.verificationCode = verificationCode;
      user.verificationCodeSentStatus = sendCodeRes.status;
      user.verificationCodeExpiration = expirationTime;
      user.verificationAttempts = 0;
      await user.save();
    }

    if (!sendCodeRes.status) {
      res.json({
        status: false,
        message: sendCodeRes.message,
        error: sendCodeRes.error,
      });
    } else {
      res.json({
        status: true,
        message: `Verification code has been sent. Code is valid for 2 minutes`,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Internal server error. Please try again",
      error: err.message,
    });
  }
};

/* VERIFY CODE AND REGISTER / LOGIN USER */
export const verifyCode = async (req, res, action_type) => {
  try {
    // Get request body parameters
    let {
      name,
      countryCode: _countryCode,
      phoneNumber: _phoneNumber,
      verificationCode,
    } = req.body;

    // Validate phone number
    const {
      isValid: phoneNumberIsValid,
      phoneNumber,
      countryIso2,
    } = validatePhoneNumber(`${_countryCode}${_phoneNumber}`);
    if (!phoneNumberIsValid) {
      res
        .status(200)
        .json({ status: false, message: "Please enter a valid phone number" });
      return;
    }

    // Check if country is allowed
    if (!ALLOWED_COUNTRY_CODES.includes(countryIso2)) {
      res.status(200).json({
        status: false,
        message: `Sorry, currenty we support only the following countries:  ${ALLOWED_COUNTRY_CODES.join(
          ", "
        )}`,
      });
      return;
    }

    // Find the user in the database
    const user = await User.findOneAndUpdate(
      { phoneNumber },
      { $inc: { verificationAttempts: 1 } },
      { new: true }
    );

    // Handle cases where user is not found or invalid
    if (!user) {
      res.status(200).json({
        status: false,
        message: "Verification code not yet generated for this phone number.",
      });
    } else if (action_type === "register" && user.userId !== phoneNumber) {
      res.status(200).json({
        status: false,
        message:
          "This phone number is already registered with us. Please login to continue.",
      });
    } else if (action_type === "login" && user.userId === phoneNumber) {
      res.status(200).json({
        status: false,
        message:
          "This phone number is not yet registered with us. Please register to continue.",
      });
    } else if (action_type === "login" && user.isVerified) {
      res.status(200).json({
        status: false,
        message:
          "This phone number is already verified with last generated code. Please generate new code to verify again.",
      });
    } else if (
      user.verificationAttempts > parseInt(MAX_VERIFICATION_ATTEMPTS)
    ) {
      res.status(200).json({
        status: false,
        message:
          "Maximum number of attempts reached. Please generate new verification code",
      });
    }
    // Check if the verification code has expired
    else if (
      !user.verificationCode ||
      user.verificationCodeExpiration < new Date()
    ) {
      user.isVerified = false;
      user.verificationCode = "";
      res.status(200).json({
        status: false,
        message:
          "Verification code has expired. Please generate new verification code.",
      });
    }
    // Check if the verification code matches
    else {
      let isMatch;
      if (HASH_VERIFICATION_CODE) {
        isMatch = await bcrypt.compare(
          verificationCode.toString(),
          user.verificationCode
        );
      } else {
        isMatch = verificationCode == user.verificationCode;
      }
      if (!isMatch) {
        return res
          .status(200)
          .json({ status: false, message: "Invalid verification code" });
      }

      // Update the user's status to "verified"
      user.isVerified = true;
      user.lastVerifiedAt = new Date();
      user.verificationCode = " ";

      // Generate a JWT token with user information
      const token = jwt.sign(
        { name: user.name, userId: user.userId, phoneNumber: user.phoneNumber },
        JWT_SECRET,
        { expiresIn: 120 * 60 } // token expires in 2 hours
      );

      // If action_type is "register", set user ID and name
      if (action_type === "register") {
        user.userId = uuidv4();
        user.name = name;
      }

      // Save the updated user information to the database
      await user.save();

      // Set the JWT token as an HTTP-only cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 2 * 60 * 1000, // token expires in 2 hours
      });

      // Return the response with user information and JWT token
      res.status(200).json({
        status: true,
        message: "Phone number successfully verified",
        data: {
          name: user.name,
          userId: user.userId,
          phoneNumber: user.phoneNumber,
        },
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Internal server error. Please try again",
      error: err.message,
    });
  }
};
