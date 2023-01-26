# Installing and Local Development

## Local Development

SCREEN is deployed using node 14. You can use `nvm install 14.21.2` or you can add `--openssl-legacy-provider` to `"start": "react-scripts start"`.

## Installing

[https://askubuntu.com/a/850947]

``` bash
sudo apt-get purge nodejs npm
curl -sL [https://deb.nodesource.com/setup_6.x] | sudo -E bash -
sudo apt-get install -y nodejs
```

[https://medium.com/@sifium/using-npm-install-without-sudo-2de6f8a9e1a3]

``` bash
mkdir ~/.npm
npm config set prefix ~/.npm
nano ~/.bashrc
export PATH="$PATH:$HOME/.npm/bin"
source ~/.bashrc

npm install webpack webpack-dev-server
```
