#!/usr/bin/env node

var fs = require("fs-extra");
var path = require("path");

var PrettyStream = require('bunyan-prettystream');
var bunyan = require("bunyan")

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);
var logger = bunyan.createLogger({
  name:'logs',
  streams: [
    {stream: prettyStdOut}
]});

var fileName = 'pre-push';

var minimist = require('minimist')(process.argv.slice(2));

var help = function() {
	console.log('show a nice help here');
}


var _add = function(file) {
	fs.exists(file, function(result) {
		if (result) {
			logger.warn("File " + file + " already found, writting anyway");
		}
		fs.copy(
			path.normalize(__dirname + "/hooks/" + fileName), 
			file, 
			{clobber: true},
			function(err) {
				if (err) {
					logger.error("Problem creating file " + file, err);
				} else {
					logger.info("Updating hook " + file);
				}
			}
		)
	})
}

var _remove = function(file) {
	fs.exists(file, function(result) {
		if (result) {
			fs.unlink(
				file, 
				function(err) {
					if (err) {
						logger.error("Problem removing hook " + file, err);
					} else {
						logger.info("Removing hook " + file);
					}
				}
			)
		} else {
			logger.warn("File " + file + " not found, skipping");
			return;
		}
	})

}

var modifyOne = function(folder, flag) {
	//check that the folder exists
	fs.exists(folder, function(result) {
		//check also that .git exists and hook inside
		if (result == false) {
			logger.error("Folder " + folder + " not found");
			return;
		}

		fs.exists(path.normalize(folder + "/.git"), function(result) {
			if (result == false) {
				logger.warn("No repository .git found in folder  " + folder);
				return;
			}
			var hooksPath = path.normalize(folder + "/.git/hooks");
			fs.exists(hooksPath, function(result) {
				if (result == false) {
					logger.error("Unexpected problem " + hooksPath + " not found");
					return;
				}
	
				var finalFile = path.normalize(hooksPath + '/' + fileName);
				if (flag == 'add') {
					_add(finalFile);
				} else
				if (flag == 'remove') {
					_remove(finalFile);
				} else {
					console.log('WTF!')
				}

			});
		});
	});
}

var modifyMany = function(folder, flag) {
	fs.readdir(folder, function (err, list) {
		if (err) {
			logger.error("Cannot read path ", folder);
			return;
		}
		list.forEach(function(file) {
			if (file == 'node_modules' 
				|| file == 'bower_components'
				|| file == '.git') {
				return;
			}
			var currentFolder = folder + "/" + file;

//			logger.info (folder + "/" + file)
			fs.stat(currentFolder, function(err, stats) {
				if (err) {
					logger.error('Cannot stat file ' + currentFolder, err);
					return;
				}
				if (stats.isDirectory()) {
					modifyOne(currentFolder, flag);
					modifyMany(currentFolder, flag);
				}
			});
		})
	})
}

module.export = {
	modifyOne: modifyOne,
	modifyMany: modifyMany
}

if (require.main == module) {

	var options = {add: false, remove: false};
	minimist._.forEach(function(item) {
		if (item == 'add' || item == 'remove') {
			options[item] = true;
		}
	})

	if ((options.add && options.remove) || !(options.add || options.remove)) {
		help();
		return;
	}

	var flag = options.add ? 'add' : 'remove';
	var folder = process.cwd();
	var gitFolder = folder + '/.git';
	fs.exists(gitFolder, function(result) {
		// repository exists, trying to modify one
		if (result == true) {
			modifyOne(folder, flag);
			return;
		}
		// otherwise try to modify many
		modifyMany(folder, flag);
	})
}