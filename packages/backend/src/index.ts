import type { Server } from 'http';

import cors from 'cors';
import express, { Application, json, urlencoded } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerOptions } from './config/swagger';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contact';
import healthRoutes from './routes/health';
import adminInquiriesRoutes from './routes/adminInquiries';
import adminFormsRoutes from './routes/adminForms';
import formsRoutes from './routes/forms';
import postsRoutes from './routes/posts';
import profileRoutes from './routes/profile';
import servicesRoutes from './routes/services';

const app: Application = express();
const PORT = env.port;

// Generate Swagger specification
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMaxRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Swagger documentation endpoint
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Adria Cross API Documentation',
  })
);

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/inquiries', adminInquiriesRoutes);
app.use('/api/v1/admin/forms', adminFormsRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/posts', postsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/forms', formsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
let server: Server | null = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`Backend server running on port ${PORT}`);
    logger.info(`Environment: ${env.nodeEnv}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  if (!server) {
    process.exit(0);
    return;
  }

  logger.warn('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
