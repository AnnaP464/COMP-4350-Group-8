# 1) Check if PostgreSQL installed

```bash
psql --version
```
If you don't see the version, install it from https://www.postgresql.org/ and don't forget to add the /bin to path
if if it doesn't authomatically.
Note the password you set when installing postgresql. Might need when entering psql shell

# 2) Set up a stub db
Open psql shell  
Password for hivedev: verysafe  
Password for postgres: the password you set while installation  

```bash
psql -h 127.0.0.1 -U postgres -d postgres
```
Then enter password of postgres
Then run:
```bash
CREATE ROLE hivedev WITH LOGIN PASSWORD 'verysafe';
CREATE DATABASE hivehand OWNER hivedev;
\q
```

To see the db:
```bash
psql -h 127.0.0.1 -U hivedev -d hivehand
```
then enter password of hivedev
# 3) Navigate to /backend

## i) Run the DB migration
```bash
psql -h 127.0.0.1 -U hivedev -d hivehand -f .\migrations\001_init.sql
```

## ii) Install Server dependencies if needed
```bash
npm install
```

## iii) Run the Server
```bash
npm run dev
```
output: Server running on http://localhost:4000

