# Use official Nginx image as base
FROM nginx:alpine

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
COPY images/ ./images/
COPY js/ ./js/

# Copy custom Nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
