import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  // Start an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Disconnect any existing connection first to avoid conflicts
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to the in-memory server
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  // Clean all collections between tests so tests are isolated
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
