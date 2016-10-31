#!/bin/bash

webpack -p --define process.env.NODE_ENV='\"production\"' --config ./webpack.production.config.js --watch --progress --colors
