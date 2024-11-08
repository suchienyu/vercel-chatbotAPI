#!/bin/bash
set -e

# 等待 PostgreSQL 啟動
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER
do
  echo "Waiting for PostgreSQL to start..."
  sleep 1
done

echo "PostgreSQL is up - executing command"

# 檢查 vector 擴展是否已安裝
psql -h $DB_HOST -U $DB_USER -d $DB_DATABASE -c 'CREATE EXTENSION IF NOT EXISTS vector;' || true

# 啟動應用
exec npm start