#!/bin/bash

NODE_ENV="production" webpack -p --config ./webpack.production.config.js --watch --progress --colors
