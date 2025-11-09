import fastify, {FastifyInstance} from 'fastify';
import cors from '@fastify/cors';
import apiRouter from '../api/router';

/**
 * Creates a test Fastify instance with API routes registered
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false, // Disable logging in tests
  });

  // Register CORS plugin
  await app.register(cors, {
    origin: true,
  });

  // Set custom error handler (same as production)
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error && typeof error === 'object' && 'validation' in error) {
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation error',
        validation: (error as {validation: unknown}).validation,
      });
      return;
    }

    const errorObj = error as {statusCode?: number; name?: string; message?: string};
    const statusCode = errorObj.statusCode || 500;
    // Use 'Internal Server Error' if name is missing, undefined, or is the default 'Error'
    const errorName = errorObj.name && errorObj.name !== 'Error' ? errorObj.name : 'Internal Server Error';
    reply.code(statusCode).send({
      statusCode,
      error: errorName,
      message: errorObj.message || 'An error occurred',
    });
  });

  // Register API routes
  await app.register(apiRouter, {prefix: '/api'});

  return app;
}

/**
 * Helper to wait for app to be ready
 */
export async function waitForApp(app: FastifyInstance): Promise<void> {
  await app.ready();
}

/**
 * Helper to close app after tests
 */
export async function closeApp(app: FastifyInstance): Promise<void> {
  await app.close();
}
