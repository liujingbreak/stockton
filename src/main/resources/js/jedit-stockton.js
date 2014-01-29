(function(){
	"use strict";
	var logger = java.util.logging.Logger.getLogger("jedit-stockton_js");
try{
	var lan = java.lang,
	out = java.lang.System.out,
	logging = java.util.logging,
	sd = Packages.sidekick,
	io = java.io,
	moz = org.mozilla.javascript,
	sp = Packages.stockton.sidekickParser
	;
	
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
		logger.getHandlers().forEach(function(h){
				out.println(">>>remove log file handler");
				logger.removeHandler(h);
		});
		logger.addHandler(fh);
		
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
	
	
	
	log("Greeting from Javascript ...");
	__invoker.greets();
	
	function buildSidekickTree(uiNode, result){
		result.forEach(function(el){
				if(el === null || el === undefined)
					return;
				uic = new javax.swing.tree.DefaultMutableTreeNode();
				var sidekick = new sp.SidekickNode(el.name, "");
				sidekick.setStartOffset(el.start);
				sidekick.setEndOffset(el.stop);
				uic.setUserObject(sidekick);
				uiNode.add(uic);
		});
	}
	
	var actions = {
		p:function(fname, text){
			log(fname);
			if(fname.length > 6 && fname.substring(fname.length - 6) == '.pegjs'){
				var r = parsePEG(text);
				var data = new sd.SideKickParsedData(fname);
				buildSidekickTree(data.root, r);
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
