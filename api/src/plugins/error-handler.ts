import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | AppError | ZodError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.flatten(),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    const statusCode = "statusCode" in error && error.statusCode ? error.statusCode : 500;
    logger.error(
      {
        err: error,
        requestId: request.id,
        method: request.method,
        url: request.url,
      },
      "unhandled_error",
    );

    return reply.status(statusCode).send({
      code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
      message: statusCode >= 500 ? "Internal server error" : error.message,
    });
  });
}
