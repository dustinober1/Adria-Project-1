#!/bin/bash
# Script to generate self-signed SSL certificates for local HTTPS development

echo "Generating self-signed SSL certificates for local HTTPS..."

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/server.key 2048

# Generate certificate signing request
openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

echo "
SSL certificates generated successfully!

Files created:
- ssl/server.key (private key)
- ssl/server.crt (certificate)

To use HTTPS in development:
1. Update your application to use SSL
2. For testing with uvicorn, you can run:
   uvicorn backend.main_production:app --host 0.0.0.0 --port 8443 --ssl-keyfile ssl/server.key --ssl-certfile ssl/server.crt

Note: For production, you should obtain a proper SSL certificate from a Certificate Authority (CA) like Let's Encrypt.
"