Overview:


Database setup:
PostgresQL 9.6 running on host "postgresql" on port 5432

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

pip install --user cherrypy
pip install --user cherrys hiredis
pip install --user  --upgrade google-api-python-client
pip install --user  jinja2
pip install --user  natsort
pip install --user  requests
pip install --upgrade --user scipy
pip install --user python-dateutil
pip install --user joblib
pip install --user ucscgenome
pip install --user ujson

-- To see Globals for UI
http://127.0.0.1:9006/globalData/mm10/0
