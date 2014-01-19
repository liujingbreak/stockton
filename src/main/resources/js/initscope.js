var module = {exports: {}};
var exports = module.exports, 
	console = {
			log:function(s){
					System.out.println("js:"+ s);
			}
	};

function require(fname){
		return __invoker.requireJs(fname);
}


