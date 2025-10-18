#!/bin/bash
# Setup script for PostgreSQL database

echo "Setting up PostgreSQL database for Adria Style Studio..."

# Instructions for the user
echo "
Please run the following commands as the postgres user to set up the database:

1. Switch to postgres user:
   sudo -u postgres psql

2. In the PostgreSQL prompt, run these commands:
   CREATE USER adria_user WITH PASSWORD 'adria_password';
   CREATE DATABASE adria_style_studio OWNER adria_user;
   GRANT ALL PRIVILEGES ON DATABASE adria_style_studio TO adria_user;
   \\q

3. Then update your .env file with the correct credentials if needed.

Alternatively, if you want to use the default postgres user, you can keep the DATABASE_URL as:
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost/adria_style_studio

After setting up the database, you can run the application with:
python -m backend.init_db
"

echo "
To run the application with PostgreSQL:
1. Make sure PostgreSQL is running: sudo systemctl start postgresql
2. Update your .env file with the correct database credentials
3. Install PostgreSQL dependencies: pip install psycopg2-binary
4. Run the database initialization: python -m backend.init_db
5. Start the application: uvicorn backend.main_production:app --host 0.0.0.0 --port 8000
"