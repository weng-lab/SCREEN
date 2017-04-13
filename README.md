Overview:


Database setup:
PostgresQL 9.6 running on host "postgresql" on port 5432

recommended setup for development:
~/.pgpass
postgresql:5432:regElmViz:regElmViz_usr:<password>

/etc/hosts
127.0.0.1   postgresql


Required packages:

--C++
sudo apt install libatlas-base-dev  libcurl4-gnutls-dev

-- To see Globals for UI
http://127.0.0.1:9006/globalData/mm10/0


https://pypi.python.org/pypi/cherrys
pip install cherrys
pip install hiredis

sudo apt-get install redis-server

pip install --user  --upgrade google-api-python-client

 psql -U regElmViz_usr -d screenv11 -w -h postgresql
 