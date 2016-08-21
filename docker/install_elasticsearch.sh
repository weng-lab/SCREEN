#!/bin/bash

add-apt-repository ppa:webupd8team/java
apt-get update
apt-get install oracle-java8-installer
dpkg -i elasticsearch-2.3.5.deb
