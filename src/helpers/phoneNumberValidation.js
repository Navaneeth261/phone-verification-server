import { phone } from 'phone';

/**
 * Validates a phone number with a given country code
 * @param {string} phoneNumber - The phone number to validate
 * @param {string} countryCode - The country code for the phone number
 * @returns {string} - The validated phone number with country code
 */
export const validatePhoneNumber = (phoneNumber, countryCode) => {
  // Use the `phone` library to format and validate the phone number
  const formattedNumber = phone(phoneNumber, countryCode);
  return formattedNumber;
};