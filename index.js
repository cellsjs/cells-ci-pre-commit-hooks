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
				logger.error("No repository .git found in folder  " + folder);
				return;
			}
			var hooksPath = path.normalize(folder + "/.git/hooks");
			fs.exists(hooksPath, function(result) {
				if (result == false) {
					logger.error("Unexpected problem " + hooksPath + " not found");
					return;
				}
	
				var finalFile = path.normalize(hooksPath + '/pre-commit');

				fs.exists(finalFile, function(result) {
					if (result) {
						logger.error("File " + finalFile + " already found, aborting");
						return;
					}
					fs.copy(
						path.normalize(__dirname + "/hooks/pre-commit"), 
						finalFile, 
						function(err) {
							logger.error("Problem creating file " + finalFile);
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
			fs.stat(file, function(err, stats) {
				if (err) {
					logger.error('Cannot stat file ' + file);
					return;
				}
				if (stats.isDirectory()) {
					createOne(file);
					createMany(file);
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
	fs.exists('./.git', function(result) {
		// repository exists, trying to create one
		if (result == true) {
			createOne(folder);
			return;
		}
		// otherwise try to create many
		createMany(folder);
	})
}
