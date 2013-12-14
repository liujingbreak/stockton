
(function(){
	"strict mode"
	var out = Packages.java.lang.System.out;
	
	out.println("Greeting from Javascript ...");
	
	function main(arg){
		out.println("Main function from Javascript ! "+ arg);
	}
	//exports.main = main;
	return main;
})();
