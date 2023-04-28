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
  COOKIE_DOMAIN,
} from "../config/env.js";

// Import local modules
import { User } from "../models/index.js";
import { validatePhoneNumber } from "../helpers/phoneNumberValidation.js";
import { sendVerificationCodeToPhoneNumber } from "../helpers/awsSnsHelper.js";

import {
  updateUser,
  generateCode,
  hashVerificaionCode,
  validateRegister,
  validateLogin,
  validateGenerateCodeInputs,
  validateVerifyAndRegisterInputs,
  validateVerifyAndLoginInputs,
  validateRegisterVerification,
  validateLoginVerification,
} from "./helpers/authHelper.js";

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
  await generateVerificationCode(req, res, "Register");
};

export const getLoginCode = async (req, res) => {
  await generateVerificationCode(req, res, "Login");
};

export const registerWithCode = async (req, res) => {
  await verifyCode(req, res, "Register");
};

export const loginWithCode = async (req, res) => {
  await verifyCode(req, res, "Login");
};

export const generateVerificationCode = async (req, res, action_type) => {
  try {
    const validateInputRes = validateGenerateCodeInputs(req.body);
    if (!validateInputRes.status) {
      res.status(200).json(validateInputRes);
      return;
    }

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
    const user = await User.findOne({ phoneNumber });

    if (action_type === "Register") {
      const validateRegisterRes = validateRegister(user);
      if (!validateRegisterRes.status) {
        res.status(409).json(validateRegisterRes);
        return;
      }
    } else if (action_type === "Login") {
      const validateLoginRes = validateLogin(user);
      if (!validateLoginRes.status) {
        res.status(409).json(validateLoginRes);
        return;
      }
    }

    // Check if the country is supported to send SMS
    if (!ALLOWED_COUNTRY_CODES.includes(countryIso2)) {
      res.status(200).json({
        status: false,
        message: `Sorry, currenty we support only the following countries:  ${ALLOWED_COUNTRY_CODES.join(
          ", "
        )}`,
      });
      return;
    }

    let verificationCode = generateCode();
    const textMessage = `Your one time verification code to ${action_type.toLowerCase()} is ${verificationCode}. Valid for 2mins.`;

    // send the verification code via SMS
    const sendCodeRes = await sendVerificationCodeToPhoneNumber(
      phoneNumber,
      textMessage
    );

    //Console log the Phone Number and Verification Code in Development Mode
    if (NODE_ENV === "development") {
      console.log(`Phone Number: ${_countryCode}${_phoneNumber}`);
      console.log(`Verification Code: ${verificationCode}`);
      console.log(`SMS Message: ${textMessage}`);
    }

    if (HASH_VERIFICATION_CODE) {
      verificationCode = hashVerificaionCode(verificationCode);
    }

    const verificationObject = {
      id: user && user?.verification ? user.verification.id + 1 : 1,
      code: verificationCode,
      sentStatus: sendCodeRes.status,
      createdAt: new Date(),
      attempts: 0,
      isVerified: false,
      verifiedAt: null,
      status: `${action_type} Code generated and SMS sent to user`,
      code_type: action_type,
    };

    if (action_type === "Register") {
      const newUser = await User.findOneAndUpdate(
        { phoneNumber },
        {
          name: " ",
          userId: phoneNumber,
          phoneNumber,
          userStatus: "Not Registered",
          verification: verificationObject,
          $set: {
            [`verificationHistory.${verificationObject.id.toString()}`]:
              verificationObject,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
    } else if (action_type === "Login") {
      user.verification = verificationObject;
      user.verificationHistory.set(
        verificationObject.id.toString(),
        verificationObject
      );
      await user.save();
    }

    if (sendCodeRes.status) {
      res.json({
        status: true,
        message: `Verification code has been sent. Code is valid for 2 minutes`,
      });
    } else {
      res.json({
        status: false,
        message: sendCodeRes.message,
        error: sendCodeRes.error,
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
    //Validating the Inputs in request body
    let validateInputRes;
    if (action_type === "Register") {
      validateInputRes = validateVerifyAndRegisterInputs(req.body);
    } else if (action_type === "Login") {
      validateInputRes = validateVerifyAndLoginInputs(req.body);
    }
    if (!validateInputRes.status) {
      res.status(200).json(validateInputRes);
      return;
    }

    // Get request body parameters
    const {
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

    // Find the user in the database and upate the verificaation attempt
    const user = await User.findOneAndUpdate(
      { phoneNumber },
      { $inc: { "verification.attempts": 1 } },
      { new: true }
    );

    const sessionId = user?.verification?.id.toString();

    // Handle cases where user is not found or invalid
    if (!user) {
      res.status(200).json({
        status: false,
        message: "Verification code not yet generated for this phone number.",
      });
      return;
    }

    // Validate the Verification Request
    if (action_type === "Register") {
      const validateRegisterRes = validateRegisterVerification(user);
      if (!validateRegisterRes.status) {
        res.status(409).json(validateRegisterRes);
        const verificationObject = {
          ...user.verification.toObject(),
          status: user.verification.status + ", " + validateRegisterRes.message,
        };
        updateUser(sessionId, user, verificationObject);
        return;
      }
    } else if (action_type === "Login") {
      const validateLoginRes = validateLoginVerification(user);
      if (!validateLoginRes.status) {
        res.status(409).json(validateLoginRes);

        const verificationObject = {
          ...user.verification.toObject(),
          status: user.verification.status + ", " + validateLoginRes.message,
        };
        updateUser(sessionId, user, verificationObject);
        return;
      }
    }

    // Other Validation before Verification

    if (user.verification.attempts > parseInt(MAX_VERIFICATION_ATTEMPTS)) {
      res.status(200).json({
        status: false,
        message:
          "Maximum number of attempts reached. Please generate new verification code",
      });
      const verificationObject = {
        ...user.verification.toObject(),
        status:
          user.verification.status +
          ", Maximum number of attempts reached. Please generate new verification code",
      };
      updateUser(sessionId, user, verificationObject);
      return;
    }

    // Check if the verification code has expired
    const isExpired =
      (new Date() - user.verification.createdAt) / (1000 * 60) >
      VERIFICATION_CODE_EXPIRE_IN_MINS
        ? true
        : false;
    if (isExpired) {
      user.verification.isVerified = false;
      user.verification.code = " ";
      res.status(200).json({
        status: false,
        message:
          "Verification code has expired. Please generate new verification code.",
      });

      const verificationObject = {
        ...user.verification.toObject(),
        status:
          user.verification.status +
          ", Verification code has expired. Please generate new verification code.",
      };
      updateUser(sessionId, user, verificationObject);
      return;
    }
    // Check if the verification code matches
    let isMatch;
    if (HASH_VERIFICATION_CODE) {
      isMatch = await bcrypt.compare(
        verificationCode.toString(),
        user.verification.code
      );
    } else {
      isMatch = verificationCode == user.verification.code;
    }
    if (!isMatch) {
      res
        .status(200)
        .json({ status: false, message: "Invalid verification code" });
      const verificationObject = {
        ...user.verification.toObject(),
        status: user.verification.status + ", Invalid verification code.",
      };
      updateUser(sessionId, user, verificationObject);
      return;
    }

    // If action_type is "Register", set user ID and name
    if (action_type === "Register") {
      user.userId = uuidv4();
      user.name = name;
      user.userStatus = "Registered";
    }

    const verificationObject = {
      ...user.verification.toObject(),
      code: " ",
      isVerified: true,
      verifiedAt: new Date(),
      status:
        user.verification.status +
        `, ${action_type} Code verified and logged in`,
    };

    updateUser(sessionId, user, verificationObject);
    // Generate a JWT token with user information
    const token = jwt.sign(
      {
        sessionId,
        name: user.name,
        userId: user.userId,
        phoneNumber: user.phoneNumber,
      },
      JWT_SECRET,
      { expiresIn: 2 * 60 } // token expires in 2 hours
    );

    // Set the JWT token as an HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 2 * 60 * 1000, // token expires in 2 hours
      domain: COOKIE_DOMAIN,
    });

    // Return the response with user information and JWT token
    res.status(200).json({
      status: true,
      message: "Phone number successfully verified",
      data: {
        name: user.name,
        userId: user.userId,
        phoneNumber: user.phoneNumber,
        sessionId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Internal server error. Please try again",
      error: err.message,
    });
  }
};
