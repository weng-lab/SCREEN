var shell = require('shelljs');

shell.cp('src/config.json', 'dist/');
shell.cp('src/db/colors.json', 'dist/db/');
