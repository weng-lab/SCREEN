#!/bin/bash

# this is meant to be run ONCE right after initial setup
# to copy out some stuff to external filesystems

# docker run -ti --rm -v /data/docker/annotation:/mnt myimageid /root/copyfs.sh

# assume external mounts at /mnt!
tar cf - /home /var/log /etc/ssh /data | tar -C /mnt -xvf -

