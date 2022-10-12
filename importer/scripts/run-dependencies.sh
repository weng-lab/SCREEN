#!/bin/bash
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

docker-compose -f docker-compose.deps.yml up -d
until docker exec importer_postgrestest_1 psql -c "select 1" --user postgres > /dev/null 2>&1; do
    sleep 2;
done
