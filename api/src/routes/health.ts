import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { registry } from "../lib/metrics.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => ({ status: "ok" }));

  app.get("/readyz", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch {
      return reply.status(503).send({ status: "not_ready" });
    }
  });

  app.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", registry.contentType);
    return registry.metrics();
  });
}
