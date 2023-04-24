import CryptoJS from "crypto-js";
import { ENCRYPTION_KEY } from "../config/env.js";

const secretKey = ENCRYPTION_KEY;

/**
 * Encrypts the given data using AES encryption algorithm
 * @param {Object} data - The data to be encrypted
 * @returns {string} The encrypted data as a string
 */
export const encrypt = (data) => {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  return ciphertext;
}

/**
 * Decrypts the given ciphertext using AES encryption algorithm
 * @param {string} ciphertext - The ciphertext to be decrypted
 * @returns {Object|undefined} The decrypted data as an object or undefined if decryption fails
 */
export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  if (plaintext) {return JSON.parse(plaintext);}
  return;
}

/**
 * Decrypts each value in the input JSON object using AES encryption algorithm
 * @param {Object} inputJSON - The input JSON object with encrypted values
 * @returns {Object} The decrypted JSON object
 */
export const decryptJSON = (inputJSON) => {
  const decryptedJSON = {};
  for (const key in inputJSON) {
    decryptedJSON[key] = decrypt(inputJSON[key]);
  }
  return decryptedJSON;
}

/**
 * Encrypts each value in the input JSON object using AES encryption algorithm
 * @param {Object} inputJSON - The input JSON object with plaintext values
 * @returns {Object} The encrypted JSON object
 */
export const encryptJSON = (inputJSON) => {
  const encryptedJSON = {};
  for (const key in inputJSON) {
    encryptedJSON[key] = encrypt(inputJSON[key]);
  }
  return encryptedJSON;
}
