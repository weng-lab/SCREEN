Overview:


Database setup:
PostgresQL 9.6 running on host "postgresql" on port 5432

CREATE EXTENSION pg_trgm;

recommended setup for development:
~/.pgpass
postgresql:5432:regElmViz:regElmViz_usr:<password>

/etc/hosts
127.0.0.1   postgresql

psql -U regElmViz_usr -d screenv11 -w -h postgresql

Required packages:
--C++
sudo apt install libatlas-base-dev  libcurl4-gnutls-dev

--for website
sudo apt-get install python-psycopg2
sudo apt-get install redis-server

pip install --user cherrypy cherrys hiredis jinja2 natsort requests joblib ucscgenome ujson configparser python-dateutil
pip install --upgrade --user scipy google-api-python-client

-- for memcached caching
sudo apt install memcached libmemcached-dev
pip install --user pylibmc

-- To see Globals for UI
http://127.0.0.1:9006/globalData/mm10/0
