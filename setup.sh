#!/bin/bash

# Step 1: Install root dependencies (lint, playwright)
echo "Installing root dependencies..."
npm install

# Step 2: Setup PostgreSQL database
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

echo "Creating extensions in $DB_NAME..."
psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
echo "Extensions ready in $DB_NAME."

psql -U $DB_USER -d $DB_NAME -f ./backend/migrations/001_init.sql
psql -U $DB_USER -d $DB_NAME -f ./backend/migrations/002_Event_Registration.sql
psql -U $DB_USER -d $DB_NAME -f ./backend/migrations/003_Event_geofence.sql
psql -U $DB_USER -d $DB_NAME -f ./backend/migrations/004_Event_attendance.sql
psql -U $DB_USER -d $DB_NAME -f ./backend/migrations/005_User_Profile.sql
psql -U $DB_USER -d $DB_NAME -f ./backend/migrations/006_Event_Signups_Status.sql

echo "Setup complete!"