import { DbMessage } from "../models/index.js";

/* READ */
// Get user information using userId and phoneNumber
export const getUser = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    // Below messages are displayed in UI once the user login.
    // Find all messages in the collection and convert the result to an array
    const messages = await DbMessage.find({});
    const DbMessageArray = messages?.map((message) => message.message);
    const apiArr = DbMessageArray.filter(item => item.startsWith("api_")).map(item => item.substring(4)); // remove "api_"
    const uiArr = DbMessageArray.filter(item => item.startsWith("ui_")) .map(item => item.substring(3)); // remove "ui_"

    // Return a response with a success status code and the user's information and message from DB
    res.status(200).json({
      status: true,
      message: {ui:uiArr,server:apiArr},
      data: { userId, phoneNumber },
    });
  } catch (err) {
    console.log(err)
    // If an error occurs, return a response with an error status code and the error message
    res.status(200).json({
      status: false,
      message: err.message,
    });
  }
};
