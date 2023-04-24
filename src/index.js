// Import dependencies
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import serverless from 'serverless-http';

// Import environment variables
import { NODE_ENV, PORT, MONGODB_URL, ALLOWED_ORIGINS } from './config/env.js';

// Import local modules
import routes from './routes/index.js';

// Create a new Express app instance
const app = express();

// Configure the app to use JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for allowed origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Store allowed origins in a variable for easier access
      const allowedOrigins = ALLOWED_ORIGINS;
      // Check if the origin is allowed
      if (allowedOrigins.indexOf(origin) === -1) {
        // If the origin is not allowed, return an error
        const msg =
          'The CORS policy for this site does not allow access from the specified origin.';
        return callback(new Error(msg), false);
      }

      // If the origin is allowed, continue with the request
      return callback(null, true);
    },
  })
);

// Handle CORS errors and internal server errors
app.use((err, req, res, next) => {
  if (
    err instanceof Error &&
    err.message ===
      'The CORS policy for this site does not allow access from the specified origin.'
  ) {
    res.status(403).json({ error: 'CORS error: ' + err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define a ping route for checking if the server is running
app.get('/api/v1/ping', async (req, res) => {
  res
    .status(200)
    .json({ status: true, message: 'Server is running. Code deployed on 24-Apr-2023 02:00' });
});

// Use the routes defined in the "routes" module
app.use('/api', routes);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to the MongoDB database and start the server
mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to database');
    if(NODE_ENV === "development" || NODE_ENV === "test") {
      app.listen(PORT, () => {
        console.log(`Server started on localhost and listening on port ${PORT}`);
      });
    }
    
  })
  .catch((err) => console.error('Error connecting to MongoDB', err));

// Export the app as a serverless function for use with AWS Lambda
export const handler = serverless(app);


