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

var createOne = function(folder) {
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

				fs.exists(finalFile, function(result) {
					if (result) {
						logger.warn("File " + finalFile + " already found, writting anyway");
					}
					fs.copy(
						path.normalize(__dirname + "/hooks/" + fileName), 
						finalFile, 
						{clobber: true},
						function(err) {
							if (err) {
								logger.error("Problem creating file " + finalFile, err);
							} else {
								logger.info("Updating hook " + finalFile);
							}
						}
					)
				})
			});
		});
	});
}

var createMany = function(folder) {
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
					createOne(currentFolder);
					createMany(currentFolder);
				}
			});
		})
	})
}

module.export = {
	createOne: createOne,
	createMany: createMany
}

if (require.main == module) {
	var folder = process.cwd();
	var gitFolder = folder + '/.git';
	fs.exists(gitFolder, function(result) {
		// repository exists, trying to create one
		if (result == true) {
			createOne(folder);
			return;
		}
		// otherwise try to create many
		createMany(folder);
	})
}