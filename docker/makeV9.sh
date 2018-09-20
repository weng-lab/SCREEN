#!/bin/bash

# this assumes ""${NAME}"" is disposable!
# runs ${IMAGE} with external file systems mounted in.

export IMAGE="bib7.umassmed.edu:5000/regelmvizv4:latest"
export NAME="screen-v9"
export BASE="/data/docker/screen-v9"

if [ "X$1" != "Xyes" ]; then
	echo
	echo "-------------------------------------------------------------------"
	echo "This script destroys existing container with name \"${NAME}\" and"
	echo "starts a new instance based on ${IMAGE}."
	echo
	echo "Run as '$0 yes' if this is what you intend to do."
	echo "-------------------------------------------------------------------"
	echo
	exit 0
fi

docker stop "${NAME}"
docker rm "${NAME}"
docker run \
       -v "/nfs/0_metadata@bib5/:/nfs/0_metadata@bib5/:ro" \
       -v "/nfs/0_metadata_zlab2@zlab2/:/nfs/0_metadata_zlab2@zlab2/:ro" \
       -v "${BASE}/data:/data" \
       -v "${BASE}/var/log:/var/log" \
       -v "${BASE}/home:/home" \
       -v "${BASE}/etc/ssh:/etc/ssh" \
       --link postgresql:postgresql \
	   --link cassandra:cassandra \
       --link redis:redis \
       --link memcached:memcached \
       -d --restart=always \
       -m 128G \
       --cpuset="48-63" \
       --hostname="${NAME}" \
       --name="${NAME}" "${IMAGE}"

docker inspect --format '{{ .NetworkSettings.IPAddress }}' "${NAME}"