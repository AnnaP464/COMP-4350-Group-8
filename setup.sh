#!/bin/bash

# Step 1: Install root dependencies (lint, playwright)
echo "Installing root dependencies..."
npm install

# Step 2: Install API dependencies
echo "Installing API dependencies..."
cd api
npm install
cd ..

# Step 3: Install frontend dependencies
echo "Installing frontend dependencies..."
cd front-end
npm install
cd ..

# Step 4: Setup PostgreSQL database
# Make sure psql is installed and the DB is accessible

DB_NAME="hivehand"
DB_USER="hivedev"
DB_PASSWORD="verysafe"

echo "Deleting the old PostgreSQL database & setting up a new one"
psql -U postgres -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS ${DB_NAME};
DROP ROLE IF EXISTS ${DB_USER};
CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
SQL

export PGPASSWORD=$DB_PASSWORD
psql -U $DB_USER -d $DB_NAME -f ./api/migrations/002_init.sql

echo "Setup complete!"