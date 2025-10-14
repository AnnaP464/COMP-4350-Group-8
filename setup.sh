#!/bin/bash

# Step 1: Install root dependencies (lint, etc)
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

echo "Deleting the old PostgreSQL database..."
psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -U postgres -c "DROP USER IF EXISTS $DB_USER;"



echo "Setting up a new PostgreSQL database..."
psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

export PGPASSWORD=$DB_PASSWORD
psql -U $DB_USER -d $DB_NAME -f ./api/migrations/001_init.sql

echo "Setup complete!"