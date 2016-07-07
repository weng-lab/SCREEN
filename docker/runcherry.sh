#!/bin/bash

# this assumes ""${NAME}"" is disposable!
# runs ${IMAGE} with external file systems mounted in.

export IMAGE="regelmviz/vanilla:v4.0"
export NAME="v4-regelmviz"
export BASE="/data/docker/regelmviz"

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
       -v "/nfs/0_metadata@bib5/:/nfs/0_metadata@bib5/:ro" \
       -v "${BASE}/data:/data" \
       -v "${BASE}/var/lib/postgresql:/var/lib/postgresql" \
       -v "${BASE}/var/log:/var/log" \
       -v "${BASE}/etc/postgresql:/etc/postgresql" \
       -v "${BASE}/home:/home" \
       -v "${BASE}/etc/ssh:/etc/ssh" \
       -p 127.0.0.1:8013:8000 \
       -p 127.0.0.1:8014:9000 \
       -p 127.0.0.1:8033:22 \
       -d --restart=always \
       -m 32G \
       --cpuset="58-62" \
       --hostname="${NAME}" \
       --name="${NAME}" "${IMAGE}"

docker inspect --format '{{ .NetworkSettings.IPAddress }}' "${NAME}"
