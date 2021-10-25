FROM ubuntu:18.04

RUN apt-get update && apt-get install -y g++ make libz-dev libbz2-dev liblzma-dev bash checkinstall python3 && rm -rf /var/lib/apt/lists/*

# this checkinstall in docker based on
#  https://github.com/magnetikonline/docker-build-deb/blob/master/nginx/Dockerfile
ARG VERSION="2.29.1"

ADD "https://github.com/arq5x/bedtools2/releases/download/v$VERSION/bedtools-$VERSION.tar.gz" /root/build/
WORKDIR /root/build
RUN tar zxvf "bedtools-$VERSION.tar.gz"
WORKDIR /root/build/bedtools2/
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN make
RUN echo "auto build of bedtools2" >description-pak && \
	checkinstall \
		--default \
		--install=no \
		--nodoc \
		--pkgname=bedtools2 \
		--pkgversion=$VERSION \
		--type=debian \
			make install

# deb should be in /root/build/bedtools2/bedtools2_$VERSION-1_amd64.deb

FROM ubuntu:18.04

RUN apt-get update && apt-get install -y python3-pip python3-numpy curl wget bash libz-dev libbz2-dev liblzma-dev  && rm -rf /var/lib/apt/lists/*

RUN pip3 install --upgrade pip

# cassnandra 3.11
# COPY cassandra.sources.list /etc/apt/sources.list.d/cassandra.sources.list
# RUN curl https://www.apache.org/dist/cassandra/KEYS | apt-key add -
# RUN mkdir ~/.gnupg
# RUN echo "disable-ipv6" >> ~/.gnupg/dirmngr.conf
# RUN apt-key adv --keyserver ipv4.pool.sks-keyservers.net --recv-key A278B781FE4B2BDA
# RUN apt-key adv --keyserver ipv4.pool.sks-keyservers.net --recv-key E91335D77E3E87CB
# ARG DEBIAN_FRONTEND=noninteractive
# RUN apt update && apt install -y cassandra-tools  && rm -rf /var/lib/apt/lists/*
# RUN pip3 install cassandra-driver

ARG VERSION="2.29.1"
COPY --from=0 "/root/build/bedtools2/bedtools2_$VERSION-1_amd64.deb" /root/
RUN dpkg -i "/root/bedtools2_$VERSION-1_amd64.deb" && rm "/root/bedtools2_$VERSION-1_amd64.deb"

RUN pip3 install cherrypy requests python-dateutil jinja2 psycopg2-binary natsort grequests gevent

# for debugging
RUN apt update && apt dist-upgrade -y && \
    apt install -y wget curl tree git software-properties-common vim telnet \
	&& rm -rf /var/lib/apt/lists/*

# emacs25
RUN add-apt-repository ppa:kelleyk/emacs -y && apt update && apt install -y emacs25-nox && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/screen/
RUN mkdir -p /bed_intersect/incoming
RUN wget http://gcp.wenglab.org/GRCh38-ccREs.bed -O /bed_intersect/grch38.sorted.bed
RUN wget http://gcp.wenglab.org/mm10-ccREs.bed -O /bed_intersect/mm10.sorted.bed
COPY api /app/screen/api
COPY common /app/screen/common
COPY utils /app/screen/utils
COPY config/production.json /app/screen/config.json

CMD python3 /app/screen/api/server.py --port 80
