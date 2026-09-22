import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { registerApiKey } from "./plugins/api-key.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerObservability } from "./plugins/observability.js";
import { healthRoutes } from "./routes/health.js";
import { eventRoutes } from "./routes/events.js";
import { participantRoutes } from "./routes/participants.js";

export async function buildApp() {
  const app = Fastify({
    logger: false,
    genReqId: () => "",
  });

  await app.register(cors, {
    origin: config.corsOrigin.split(",").map((origin) => origin.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key", "X-Request-ID"],
  });

  registerObservability(app);
  registerApiKey(app);
  registerErrorHandler(app);

  await app.register(healthRoutes);
  await app.register(eventRoutes);
  await app.register(participantRoutes);

  logger.info({ service: "events-api" }, "app_initialized");
  return app;
}
