var LL = require('../stockton-grammar-parser.js')
	, util = require('util')
	,fs = require('fs'),
	sc = require('../stocktonCompiler'),
	datn = require('../debugATN.js'),
	Compiler = sc.Compiler,
	PredictionContext  = sc.PredictionContext;


var str = fs.readFileSync('./stockton-grammar.g', {encoding: 'utf-8'});
var parser = LL.create(str);
parser.verbose();
var ast = parser.parse();

console.log(JSON.stringify(ast.result, null, '  '));

console.log('>>> test getStringFromGrammarStringLiteral()');
var escaped = Compiler.getStringFromGrammarStringLiteral(
	'\'this is new line:\\n, this is tab: \\t, this is "\\\\u0061": \\u0061\'');
console.log(escaped);

var compiler = new Compiler();
compiler.compile(str);
compiler.debugATN();

datn.debugATN(compiler);

debugger;
console.log('EmptyPredictionContext %j ', PredictionContext.EMPTY);

