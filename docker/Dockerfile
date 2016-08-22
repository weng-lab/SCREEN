# Use phusion/baseimage as base image. To make your builds reproducible, make
# sure you lock down to a specific version, not to `latest`!
# See https://github.com/phusion/baseimage-docker/blob/master/Changelog.md for
# a list of version numbers.
FROM phusion/baseimage:0.9.19

# global env
ENV HOME=/root TERM=xterm

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

# set proper timezone
RUN echo America/New_York > /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata

# update (if --no-cache)
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get -y upgrade

# install some... oh well ;-) generic stuff
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y wget rsync emacs-nox git

# install postgres, cherrypy, etc.
RUN \
	apt-get update && \
	DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client-9.5 \
				postgresql-contrib-9.5 python-pip realpath libpq-dev python-dev \
				python-dateutil python-numpy python-pil python-pandas; \
	DEBIAN_FRONTEND=noninteractive pip install psycopg2 jinja2 cherrypy npm

# create a user
RUN /bin/bash -c '/bin/mkdir /data && /usr/sbin/useradd -m -k /etc/skel -s /bin/bash -p "*" -d /data/cherrypy cherrypy && /usr/sbin/usermod -U cherrypy'

# RUN dpkg -i /data/elasticsearch-2.3.5.deb

# create /etc/rc.local
ADD /files/ /
RUN chmod 755 /etc/rc.local /root/copyfs.sh

# enable sshd
RUN /bin/rm /etc/service/sshd/down

# Clean up APT when done.
#RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
