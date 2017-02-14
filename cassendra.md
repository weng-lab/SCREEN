Installing:

follow steps at
http://cassandra.apache.org/doc/latest/getting_started/installing.html#installation-from-debian-packages
like:
echo "deb http://www.apache.org/dist/cassandra/debian 39x main" | sudo tee -a /etc/apt/sources.list.d/cassandra.sources.list
curl https://www.apache.org/dist/cassandra/KEYS | sudo apt-key add -
sudo apt-get update
sudo apt-get install cassandra

then
pip install --user cassandra-driver


http://stackoverflow.com/a/31979274
cqlsh -u 'my_username' -p 'my_password' -f /mydir/myfile.cql