export const PORT = process.env.PORT || "5500";
export const ENVIRONMENT = process.env.NODE_ENV || "development";
export const PROVIDER_HOST = process.env.PROVIDER_HOST || "localhost:5000";
export const REDIRECT_URI =
  process.env.REDIRECT_URI || "http://localhost:5500/auth/cb";
export const CLIENT_SECRET = process.env.CLIENT_SECRET || "client_secret";
export const CLIENT_ID = process.env.CLIENT_ID || "client_id";
