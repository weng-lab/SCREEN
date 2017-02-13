#!/bin/bash

# this assumes ""${NAME}"" is disposable!
# runs ${IMAGE} with external file systems mounted in.


export INSTANCE="$1"
export IMAGE="bib7.umassmed.edu:5000/regelmvizv4:latest"
export NAME="screen-prod-${INSTANCE}"
export BASE="/data/docker/screen-prod-${INSTANCE}"

if echo "$INSTANCE" | grep "^[0-9][0-9]*$" >/dev/null; then
	:
else
	echo "Instance cannot be '$INSTANCE'; should be integer"
	exit 1
fi

if [ "X$2" != "Xyes" ]; then
	echo
	echo "-------------------------------------------------------------------"
	echo "This script destroys existing container with name \"${NAME}\" and"
	echo "starts a new instance based on ${IMAGE}."
	echo
	echo "Run as '$0 <instance> yes' if this is what you intend to do."
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
       --hostname="${NAME}" \
       --name="${NAME}" "${IMAGE}"

docker inspect --format '{{ .NetworkSettings.IPAddress }}' "${NAME}"
