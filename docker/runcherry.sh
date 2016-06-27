#!/bin/bash

# this assumes ""${NAME}"" is disposable!
# runs ${IMAGE} with external file systems mounted in.

export IMAGE="factorbook/vanilla:v1.4"
export NAME="v3-factorbook"
export BASE="/data/docker/v3.factorbook"

if [ "X$1" != "Xyes" ]; then
	echo
	echo "--------------------------------------------------------------------"
	echo "This script destroys existing container with name \"${NAME}\" and"
	echo "starts a new instance based on ${IMAGE}."
	echo
	echo "Run as '$0 yes' if this is what you intend to do."
	echo "--------------------------------------------------------------------"
	echo
	exit 0
fi

docker stop "${NAME}"
docker rm "${NAME}"
docker run \
	-v "${BASE}/data:/data" \
	-v "${BASE}/var/lib/postgresql:/var/lib/postgresql" \
        -v "${BASE}/var/log:/var/log" \
        -v "${BASE}/etc/postgresql:/etc/postgresql" \
        -v "${BASE}/home:/home" \
	-p 127.0.0.1:8012:8000 \
	-p 127.0.0.1:8032:22 \
	-d --restart=always \
	-m 32G \
	--cpuset="50-57" \
	--hostname="${NAME}" \
	--name="${NAME}" "${IMAGE}"

docker inspect --format '{{ .NetworkSettings.IPAddress }}' "${NAME}"
