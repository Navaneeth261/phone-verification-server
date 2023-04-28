import request from 'supertest';
import app from '../index.js'
import mongoose from 'mongoose';

import { MONGODB_URL,DATABASE_NAME } from '../config/env.js';

/* Connecting to the database before each test. */
beforeEach(async () => {
  await mongoose
  .connect(MONGODB_URL, {
    dbName: DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
  });
});

/* Closing database connection after each test. */
afterEach(async () => {
  await mongoose.connection.close();
});

describe("Testing /api/auth/get-register-code endpoint", () => {
  test("returns status 200 with a success message when valid inputs are provided", async () => {
    const res = await request(app)
      .post("/api/auth/get-register-code")
      .send({ countryCode: "+91", phoneNumber: "9025865385" })
      .set("Accept", "application/json");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.message).toBe(
      "Verification code has been sent. Code is valid for 2 minutes"
    );
  });

  test("returns status 200 with an error message when an invalid phone number is provided", async () => {
    const res = await request(app)
      .post("/api/auth/get-register-code")
      .send({ countryCode: "91", phoneNumber: "123456" })
      .set("Accept", "application/json");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe("Please enter a valid phone number");
  });

  test("returns status 200 with an error message when an unsupported country code is provided", async () => {
    const res = await request(app)
      .post("/api/auth/get-register-code")
      .send({ countryCode: "+65", phoneNumber: "81516832" })
      .set("Accept", "application/json");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toBe(
      "Sorry, currenty we support only the following countries:  IN"
    );
  });
});
