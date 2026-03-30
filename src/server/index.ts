import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import * as Sentry from "@sentry/nextjs";
import type { ClientToServerEvents, ServerToClientEvents } from "@/game/types";
import { registerHandlers } from "./game/handlers";
import { shutdownAnalytics } from "@/lib/analytics";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
      pingInterval: 10000,
      pingTimeout: 5000,
    }
  );

  registerHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Alpha-bet-y server ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server running on same port`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
  });

  const shutdown = async () => {
    await shutdownAnalytics();
    await Sentry.close(2000);
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
