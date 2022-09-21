#!/bin/bash
# arg1: environment, ie encode.
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if two args not given
if [[ -z "$1" ]]; then
    echo "At least one argument required.";
    exit;
fi

# Check that jq is installed
if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed. Please install jq to continue.' >&2
  exit 1
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${1}.env.sh

# Point kubectl at kubernetes cluster for given environment
gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet config set compute/zone $COMPUTE_ZONE
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

rm -rf /tmp/devops
git clone https://github.com/weng-lab/devops.git /tmp/devops
DB_USERNAME=$(jq -r ".screen_v13_db_username" /tmp/devops/staging-db-credentials/screen-v13-db.json)
DB_PASSWORD=$(jq -r ".screen_v13_db_password" /tmp/devops/staging-db-credentials/screen-v13-db.json)
rm -rf /tmp/devops

echo "Enter the following password when prompted: ${DB_PASSWORD}"
PGDATABASE=screen__v13 gcloud sql connect screen-v13-db --user=${DB_USERNAME}

