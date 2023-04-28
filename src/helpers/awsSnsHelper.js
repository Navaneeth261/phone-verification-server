import AWS from "aws-sdk";
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  SEND_SMS
} from "../config/env.js";

// Update AWS configuration with access keys and region
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

// Create an instance of the SNS (Simple Notification Service) client
const sns = new AWS.SNS();

// Function to send a verification code to a phone number
export const sendVerificationCodeToPhoneNumber = (PhoneNumber, Message) => {
  try {
    if (!SEND_SMS) {
      console.log("SMS not sent as per Environment Variable");
      return Promise.resolve({ status: true, message: "SMS not sent as per Environment Variable" })
    }

    // Set up parameters for the SNS publish method
    const params = {
      Message,
      PhoneNumber,
    };

    // Return a Promise to handle success/failure of sending the message
    return new Promise((resolve, reject) => {
      sns.publish(params, (err, data) => {
        if (err) {
          reject({ status: false, message: "Error sending SMS", error: err });
        } else {
          console.log(data)
          resolve({ status: true, message: "SMS sent successfully", data });
        }
      });
    });
  } catch (err) {
    return Promise.reject({ status: false, message: "Error sending SMS" })
  }
};
