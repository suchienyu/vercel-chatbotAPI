#!/bin/bash
set -e

# 確保環境變數存在
if [ -z "$DB_PASSWORD" ]; then
    export DB_PASSWORD="password"
fi

if [ -z "$DB_USER" ]; then
    export DB_USER="postgres1"
fi

if [ -z "$DB_HOST" ]; then
    export DB_HOST="postgres"
fi

if [ -z "$DB_DATABASE" ]; then
    export DB_DATABASE="postgres"
fi

# 等待 PostgreSQL
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_DATABASE}" -c '\q' 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - executing command"

# 執行主程序
exec npm start