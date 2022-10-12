#!/bin/sh
# Builds docker container and tags it. Takes 1 arg:
# arg1: docker image tag (Optional)
# Example usage: scripts/push-image.sh v1.0.0
set -e


# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

./gradlew shadowJar