import mongoose from "mongoose";
const dbMessageSchema = new mongoose.Schema({
    message: {
      type: String,
      required: true,
    },
  });

// Create a new model from the dbmessages schema and export it
export const DbMessage = mongoose.model("dbmessages", dbMessageSchema)