var module = {exports: {}};

var lan = java.lang,
	out = java.lang.System.out,
	logging = java.util.logging,
	sd = Packages.sidekick,
	io = java.io,
	moz = org.mozilla.javascript,
	sp = Packages.stockton.sidekickParser
	;
var logger = java.util.logging.Logger.getLogger("js."+__fileName);
	//var JSON = require('_json2.js');
	
	var workdir = null,
		jeditPlugin, home;
	
var exports = module.exports, 
	console = {
			log:function(s){
					logger.info("js:"+ s);
			}
	};

function require(fname){
    if(fname.indexOf('./') === 0 || fname.indexOf('.\\') === 0)
        fname = fname.substring(2);
    logger.info('request JS file: "'+ fname+'"');
    return __invoker.requireJs(fname);
}


