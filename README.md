Overview:

Database setup:
PostgresQL 9.6 running on host "postgresql" on port 5432
```
CREATE EXTENSION pg_trgm;
```
recommended setup for development:

in ~/.pgpass
```
postgresql:5432:regElmViz:regElmViz_usr:<password>
```
/etc/hosts
```
127.0.0.1   postgresql
```
this should then work:
```
psql -U regElmViz_usr -d screenv11 -w -h postgresql
```
Required packages:
--C++
```
sudo apt install libatlas-base-dev  libcurl4-gnutls-dev
```
--for website
setup npm to use local ~/.npm for "global" packages:
```
https://medium.com/@sifium/using-npm-install-without-sudo-2de6f8a9e1a3
mkdir ~/.npm
npm config set prefix ~/.npm
nano ~/.bashrc
export PATH="$PATH:$HOME/.npm/bin"
source ~/.bashrc
```

and update npm
```
https://askubuntu.com/a/850947
sudo apt-get purge nodejs npm
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn
```

```
sudo apt-get install python-psycopg2
sudo apt-get install redis-server

pip install --user cherrypy cherrys hiredis jinja2 natsort requests joblib ucscgenome ujson configparser python-dateutil colorama
pip install --upgrade --user scipy google-api-python-client
```

-- for memcached caching
```
sudo apt install memcached libmemcached-dev
pip install --user pylibmc
```

-- To see Globals for UI
http://127.0.0.1:9006/globalData/mm10/0
