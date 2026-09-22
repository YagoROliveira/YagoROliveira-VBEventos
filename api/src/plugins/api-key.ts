import type { FastifyInstance } from "fastify";
import { apiKeysMatch } from "../lib/api-key.js";
import { config } from "../lib/config.js";

const PUBLIC_PREFIXES = ["/healthz", "/readyz", "/metrics"];

export function registerApiKey(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "OPTIONS") return;
    if (PUBLIC_PREFIXES.some((path) => request.url.split("?")[0] === path)) return;

    if (!apiKeysMatch(request.headers["x-api-key"], config.apiKey)) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "Invalid or missing API key",
      });
    }
  });
}
