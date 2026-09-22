import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";
import { httpRequestDuration, httpRequestsTotal } from "../lib/metrics.js";

export function registerObservability(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    const requestId = (request.headers["x-request-id"] as string | undefined) ?? randomUUID();
    request.id = requestId;
    reply.header("x-request-id", requestId);
    (request as typeof request & { startTime: number }).startTime = performance.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const started = (request as typeof request & { startTime?: number }).startTime ?? performance.now();
    const durationMs = performance.now() - started;
    const route = request.routeOptions?.url ?? request.url;
    const labels = {
      method: request.method,
      route,
      status: String(reply.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationMs / 1000);

    logger.info(
      {
        requestId: request.id,
        method: request.method,
        route,
        status: reply.statusCode,
        latencyMs: Number(durationMs.toFixed(2)),
      },
      "http_request",
    );
  });
}
