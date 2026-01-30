#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER zitadel WITH PASSWORD 'zitadelpassword';
    CREATE DATABASE zitadel;
    GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel;
EOSQL
