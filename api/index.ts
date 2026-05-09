import app, { createServer } from '../server';

// Ensure the server is initialized for serverless environments
let serverPromise: any = null;

export default async (req: any, res: any) => {
  if (!serverPromise) {
    serverPromise = createServer();
  }
  const appInstance = await serverPromise;
  return appInstance(req, res);
};