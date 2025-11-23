import type { Options } from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Adria Cross API',
    version: '1.0.0',
    description:
      'REST API for Adria Cross professional styling services platform. Provides endpoints for user authentication, client management, styling services, appointments, and content management.',
    contact: {
      name: 'Adria Cross',
      url: 'https://adriacross.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://staging-api.adriacross.com/api/v1',
      description: 'Staging server',
    },
    {
      url: 'https://api.adriacross.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT authorization token. Format: `Bearer {token}`. Obtain token from /auth/login or /auth/register endpoints.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'Adria',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Cross',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          role: {
            type: 'string',
            enum: ['client', 'admin', 'super_admin'],
            description: 'User role determining access permissions',
            example: 'client',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2025-01-15T10:30:00.000Z',
          },
          },
        required: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
      },
      UserResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful',
            example: true,
          },
          user: {
            $ref: '#/components/schemas/User',
          },
        },
        required: ['success', 'user'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'Adria',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Cross',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'User password (minimum 8 characters)',
            example: 'SecurePassword123!',
          },
        },
        required: ['email', 'password', 'firstName', 'lastName'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if login was successful',
            example: true,
          },
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'JWT authentication token',
            example:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          },
        },
        required: ['success', 'user', 'token'],
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (must be unique)',
            example: 'newuser@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description:
              'User password (minimum 8 characters, should contain uppercase, lowercase, numbers, and special characters)',
            example: 'SecurePassword123!',
          },
          role: {
            type: 'string',
            enum: ['client', 'admin', 'super_admin'],
            description:
              'User role (optional, defaults to "client"). Only super_admin can create admin/super_admin accounts.',
            example: 'client',
            default: 'client',
          },
        },
        required: ['email', 'password'],
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if registration was successful',
            example: true,
          },
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'JWT authentication token',
            example:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          },
        },
        required: ['success', 'user', 'token'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Always false for error responses',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Human-readable error message',
            example: 'Invalid email or password',
          },
          error: {
            type: 'string',
            description: 'Error code or type (optional)',
            example: 'AUTHENTICATION_FAILED',
          },
          details: {
            type: 'object',
            description: 'Additional error details (optional)',
            additionalProperties: true,
          },
        },
        required: ['success', 'message'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the API is healthy',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Health status message',
            example: 'Backend API is running',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Current server timestamp',
            example: '2025-01-15T10:30:00.000Z',
          },
          environment: {
            type: 'string',
            description: 'Current environment',
            example: 'development',
          },
        },
        required: ['success', 'message', 'timestamp', 'environment'],
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          durationMinutes: { type: 'integer' },
          priceCents: { type: 'integer' },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'name',
          'slug',
          'description',
          'durationMinutes',
          'priceCents',
          'active',
          'createdAt',
          'updatedAt',
        ],
      },
      BlogPost: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          slug: { type: 'string' },
          excerpt: { type: 'string' },
          content: { type: 'string' },
          featuredImage: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          authorId: { type: 'string', format: 'uuid' },
        },
        required: [
          'id',
          'title',
          'slug',
          'excerpt',
          'content',
          'status',
          'createdAt',
          'updatedAt',
          'authorId',
        ],
      },
      ContactInquiry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          serviceInterest: { type: 'string', nullable: true },
          message: { type: 'string' },
          status: {
            type: 'string',
            enum: ['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'],
          },
          respondedAt: { type: 'string', format: 'date-time', nullable: true },
          closedAt: { type: 'string', format: 'date-time', nullable: true },
          adminNotes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'fullName',
          'email',
          'message',
          'status',
          'createdAt',
          'updatedAt',
        ],
      },
      ContactSubmissionRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Jordan Parker' },
          email: {
            type: 'string',
            format: 'email',
            example: 'jordan@example.com',
          },
          phone: { type: 'string', example: '+1 555-123-4567' },
          serviceInterest: {
            type: 'string',
            example: 'Wardrobe Overhaul',
          },
          message: {
            type: 'string',
            example:
              'I would like to refresh my wardrobe before a new job starts.',
          },
          recaptchaToken: {
            type: 'string',
            description: 'reCAPTCHA v3 token from client',
          },
        },
        required: [
          'fullName',
          'email',
          'message',
          'recaptchaToken',
        ],
      },
      ContactSubmissionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              status: { type: 'string', enum: ['NEW'] },
              createdAt: { type: 'string', format: 'date-time' },
              notifications: {
                type: 'object',
                properties: {
                  visitor: { type: 'boolean' },
                  admin: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      InquiryStatusUpdateRequest: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['new', 'in_progress', 'responded', 'closed'],
          },
          adminNotes: { type: 'string' },
        },
        required: ['status'],
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - Invalid input parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Email and password are required',
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - Missing or invalid authentication token',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Unauthorized',
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Forbidden: insufficient permissions',
            },
          },
        },
      },
      NotFound: {
        description: 'Not found - Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Resource not found',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              message: 'Internal server error',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Services',
      description: 'Styling services catalogue endpoints',
    },
    {
      name: 'Posts',
      description: 'Blog/content endpoints',
    },
    {
      name: 'Contact',
      description: 'Public contact form endpoints',
    },
    {
      name: 'Admin - Inquiries',
      description: 'Admin-only inquiry management endpoints',
    },
  ],
};

export const swaggerOptions: Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API route files with JSDoc comments
};
