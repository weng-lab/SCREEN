Installing:

https://askubuntu.com/a/850947
sudo apt-get purge nodejs npm
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs


https://medium.com/@sifium/using-npm-install-without-sudo-2de6f8a9e1a3
mkdir ~/.npm
npm config set prefix ~/.npm
nano ~/.bashrc
export PATH="$PATH:$HOME/.npm/bin"
source ~/.bashrc

npm install webpack webpack-dev-server

