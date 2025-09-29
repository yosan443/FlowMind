import { config } from 'dotenv';

config();

const env = {
  PORT: process.env.PORT || 3000,
  DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/flowmind',
  NODE_ENV: process.env.NODE_ENV || 'development',
  AI_API_KEY: process.env.AI_API_KEY || '',
  D1_DATABASE_URL: process.env.D1_DATABASE_URL || '',
  D1_DATABASE_AUTH_TOKEN: process.env.D1_DATABASE_AUTH_TOKEN || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
};

export default env;