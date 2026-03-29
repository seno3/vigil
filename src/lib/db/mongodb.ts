import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/vigil';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) return global._mongooseConn;
  global._mongooseConn = await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  return global._mongooseConn;
}
