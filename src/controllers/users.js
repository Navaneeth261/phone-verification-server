import { DbMessage } from "../models/index.js";
import { COOKIE_DOMAIN } from "../config/env.js";

// Import local modules
import { User } from "../models/index.js";

/* READ */
// Get user information using userId and phoneNumber
export const getUser = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    // Below messages are displayed in UI once the user login.
    // Find all messages in the collection and convert the result to an array
    const messages = await DbMessage.find({});
    const DbMessageArray = messages?.map((message) => message.message);
    const apiArr = DbMessageArray.filter((item) => item.startsWith("api_")).map(
      (item) => item.substring(4)
    ); // remove "api_"
    const uiArr = DbMessageArray.filter((item) => item.startsWith("ui_")).map(
      (item) => item.substring(3)
    ); // remove "ui_"

    // Return a response with a success status code and the user's information and message from DB
    res.status(200).json({
      status: true,
      message: { ui: uiArr, server: apiArr },
      data: { userId, phoneNumber },
    });
  } catch (err) {
    console.log(err);
    // If an error occurs, return a response with an error status code and the error message
    res.status(200).json({
      status: false,
      message: err.message,
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: COOKIE_DOMAIN,
  });

  const { phoneNumber } = req.body;
  const user = await User.findOne({ phoneNumber });
  const sessionId = user.verification.id.toString();
  const verificationObject = {
    ...user.verification.toObject(),
    loggedOutAt: new Date(),
    status: "User Logged Out Successfully",
  };
  user.verification = verificationObject;
  user.verificationHistory.set(sessionId, verificationObject);
  await user.save();
  res.status(200).json({ message: "Logout successful", data: req.body });
};
