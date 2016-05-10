var exec = require('child_process').exec;
var fs = require('fs');

// constants
var iot4i = ['action-engine', 'shield-engine', 'historian-storage', 'insurance-dashboard', 'iot4x-api', 'iot-visualization','wearables-framework'];
var ibmmodules = [ 'ibmiotf', 'wearables-framework'];
var registry = require('npm-stats')()

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function formatDate( dateStr) {
	if ( dateStr) {
		var pos = dateStr.indexOf( "T");
		return pos >= 0 ? dateStr.substring( 0, pos) : dateStr;
	}
	
	return "";
}

function processPackage( file, results) {
	var data = fs.readFileSync(file, 'utf8');
	var pkg = JSON.parse(data);
	var repo = pkg.repository ? pkg.repository.url : "<unknown>";
	repo = repo.replace( "git+http","http").replace( "git+ssh","https").replace( "git://","https://").replace( /\.git$/, "");

	var license = pkg.license;
	if ( !license &&  pkg.licenses && pkg.licenses.length > 0) {
		license = pkg.licenses[0].type;
	}
				
	if ( iot4i.indexOf( pkg.name) >= 0) {
		// skip ibm
	}
	else {
		results.push(  { 'name': pkg.name, 'version': pkg.version, 'license': license, 'repo': repo });
	}
}

var walk = function(dir, level, maxLevel, results, done) {
	var list = fs.readdirSync(dir) 
	
	if (!list) 
		return done(err);
	
	var i = 0;

	for ( i = 0; i < list.length; ++i) {
		var fileName = list[i];
		var file = fileName;

		file = dir + '/' + file;
		
		stat = fs.statSync(file);
		if (stat && stat.isDirectory() && ibmmodules.indexOf( fileName) < 0) {
			if ( level < maxLevel) {
				walk(file, level + 1, maxLevel, results, done);
			}
		} 
		else 
		{
			if ( fileName == "package.json") {
				processPackage( file, results);
			}
		}
	}
	
	if ( level == 0) {
		done( null, results);
	}
}

walk( process.argv[2], 0, process.argv[3] || 3, [], function(err, results) {
  if (err) 
	throw err;

	results.sort( function( a,b) {
		return a.name ? a.name.localeCompare( b.name) : -1;
	});
	
	console.log( "Name,Version,Date,License,Repository");
	
	var unique = [];
	var uniqueFull = [];
	results.forEach( function( dep) {
		var data = dep.name + "," + dep.version +"," + dep.license +"," + dep.repo;
		if ( unique.indexOf(data) < 0) {
			
			unique.push( data);
			
			registry.module(dep.name).info(function(err, info) {
				
				var releaseDate = "";
				if ( info) {
					releaseDate = formatDate( info.time ? info.time[ dep.version] : "2016-01-01");
				}
				
				var dataFull = dep.name + "," + dep.version +"," + releaseDate + "," + dep.license +"," + dep.repo;
				console.log( dataFull);
			});
		}
	});
});
