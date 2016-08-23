#!/bin/bash

add-apt-repository ppa:webupd8team/java
apt-get update
apt-get install oracle-java8-installer
dpkg -i elasticsearch-2.3.5.deb
dpkg -i esbulk_0.3.7_amd64.deb
