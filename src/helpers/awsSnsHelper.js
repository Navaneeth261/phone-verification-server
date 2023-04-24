import AWS from 'aws-sdk';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } from '../config/env.js'

// Update AWS configuration with access keys and region
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});

// Create an instance of the SNS (Simple Notification Service) client
const sns = new AWS.SNS();

// Function to send a verification code to a phone number
export const sendVerificationCodeToPhoneNumber = (PhoneNumber, Message) => {
  
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
        resolve({ status: true, message: "SMS sent successfully", data });
      }
    });
  });
};
