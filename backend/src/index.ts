import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app.js';
import { initSocketServer } from './lib/socket.js';
import { startWorker } from './scheduler/worker.js';

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Attach Socket.IO to the HTTP server
initSocketServer(httpServer);

// Start BullMQ auction closure worker
startWorker();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
