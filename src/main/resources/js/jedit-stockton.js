(function(){
	"use strict";
	var logger = java.util.logging.Logger.getLogger("js.jedit-stockton_js");
try{
	var lan = java.lang,
	out = java.lang.System.out,
	logging = java.util.logging,
	sd = Packages.sidekick,
	io = java.io,
	moz = org.mozilla.javascript,
	sp = Packages.stockton.sidekickParser
	;
	var JSON = require('_json2.js');
	var workdir = null,
		jeditPlugin, home;
	
	/* function loadFile(filepath){
		var s = "";
		var input = new io.BufferedReader(new io.FileReader(filepath));
		var line = input.readLine();
		while( line != null){
			s += line;
			s += "\n";
			line = input.readLine();
		}
		eval(s);
		log(module.exports);
	} */
	
	(function setup(){
		var workdir = new java.io.File(lan.System.getProperty("user.home"), ".stockton");
		var fh = new logging.FileHandler(
			new java.io.File(workdir, "jedit-stockton.log"));
		fh.setFormatter(new logging.SimpleFormatter());
		jsLog = java.util.logging.Logger.getLogger("js");
		jsLog.getHandlers().forEach(function(h){
				out.println(">>>remove log file handler");
				jsLog.removeHandler(h);
		});
		jsLog.addHandler(fh);
		
	})();
	
	function log(s){
		logger.info(s);
	}
	
	
	function parsePEG(text){
		var parser = require("pegjs-parser.js");
		var r = parser.parse(text);
		log("array? "+ (r instanceof Array));
		
		/* r.forEach(function(el){
			if(el !== null && el.type == 'rule')
				log(el.name);
		}); */
		return r;
	}
	
	function parseJs(text){
	        var parsers = require("stockton-parsers.js");
	        var parser = new parsers.EsJSParser(require("esprima.js"), log);
	        return parser.parse(text);
	}
	
	function parseLess(text){
	    var ll = require('less-parser.js');
	    var parser = ll.create(text);
	    return parser.parse();
	}
	
	log("Greeting from Javascript ...");
	__invoker.greets();
	
	/**
	@param result an array
	[
	    {
	        fullName,
	        name,
	        start, stop,
	        child:[
	        ]
	    }
	]
	*/
	function buildSidekickTree(uiNode, result){
		result.forEach(function(el){
				if(el === null || el === undefined || typeof(el) == 'string')
					return;
				try{
                        uic = new javax.swing.tree.DefaultMutableTreeNode();
                        var showName = el.fullName? el.fullName: (el.name? el.name: '<f>');
                        var sidekick = new sp.SidekickNode(showName, "", showName.charAt(0) =='.'?3:0);
                        sidekick.setStartOffset(el.start);
                        sidekick.setEndOffset(el.stop);
                        uic.setUserObject(sidekick);
                        uiNode.add(uic);
                    }catch(e){
                        log("[buildSidekickTree] " + JSON.stringify(el));
                        throw e;
                    }
                    if(Array.isArray(el.child)){
                        buildSidekickTree(uic, el.child);
                    }
				
		});
	}
	
	var actions = {
		p:function(fname, text){
			log(fname);
			if(fname.length > 6 && fname.substring(fname.length - 6) == '.pegjs'){
				var r = parsePEG(text);
				var data = new sd.SideKickParsedData(fname);
				buildSidekickTree(data.root, r);
			}else if(fname.length > 3 && fname.substring(fname.length -3).toLowerCase() == '.js'){
			        var time0 = new Date().getTime();
			        var r = parseJs(text);
			        var time1 = new Date().getTime();
			        log("parsing duration "+ ( time1 - time0) );
			        var data = new sd.SideKickParsedData(fname);
				buildSidekickTree(data.root, r);
				log("parsing duration "+ (new Date().getTime() - time1) );
			}else if(fname.length > 4 && fname.substring(fname.length -4).toLowerCase() == '.css'){
			    var data = new sd.SideKickParsedData(fname);
			    buildSidekickTree(data.root, parseLess(text));
			}else if(fname.length > 5 && fname.substring(fname.length -5).toLowerCase() == '.less'){
			    var data = new sd.SideKickParsedData(fname);
			    buildSidekickTree(data.root, parseLess(text));
			}else{
				var data = new sd.SideKickParsedData('test');
			}
			return data;
		},
		/** clean up */
		refresh:function(){
			
			logger.getHandlers().forEach(function(h){
				out.println("remove log file handler");
				if(h instanceof logging.FileHandler){
					out.println("flush & close log file");
					h.flush();
					h.close();
				}
				logger.removeHandler(h);
			});
		},
		start:function(plugin){
				log(plugin.getPluginHome().getPath());
				jeditPlugin = plugin;
				home = plugin.getPluginHome();
		},
		stop:function(){
			actions.refresh();
		},
		about: function(){
			//loadFile("/Users/liujing/myproject/jeditplugin-parsers/src/main/javascript/pegjs-parser.js");
			__invoker.greets();
			
			log("home="+ home.getPath());
		},
		reloadjs:function(){
				__invoker.clearJsExports();
		}
	};
	
	function main(arg, arg2, arg3){
		try{
				log("Main function from Javascript - "+ arg);
				if(actions[arg])
					return actions[arg](arg2, arg3);
		}catch(e){
				out.println(e);
				var msg = "";
				for(f in e){
						msg += "[" + f + "] " + e[f] + "\n";
				}
				logger.severe(e.toString() + "\n" + msg);
		}
	}
	return main;
}catch(e){
	java.lang.System.out.println(e);
	//logger.severe(e.toString());
	return "ERROR in Javascript file";
}
})();
