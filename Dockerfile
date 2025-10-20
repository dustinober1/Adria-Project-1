# Use official Nginx image as base
FROM nginx:alpine

# Install envsubst (gettext package) for environment variable substitution
RUN apk add --no-cache gettext

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default Nginx static assets
RUN rm -rf ./*

# Copy all static files to Nginx html directory
COPY index.html .
COPY about.html .
COPY blog.html .
COPY contact.html .
COPY intake-form.html .
COPY link-checker.js .
COPY manifest.json .
COPY more-information.html .
COPY services.html .
COPY blog/ ./blog/
COPY css/ ./css/
COPY js/ ./js/

# Create images directory (since it's empty, we need to create it manually)
RUN mkdir -p images

# Copy Nginx configuration template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set default PORT environment variable (Cloud Run will override this)
ENV PORT=8080

# Expose the port (Cloud Run will use the PORT env variable)
EXPOSE ${PORT}

# Use custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
