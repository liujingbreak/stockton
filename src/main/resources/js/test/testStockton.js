var stGrammarParser = require('../stockton-grammar-parser.js'),
	LL = require('../baseLLParser.js')
	, util = require('util')
	,fs = require('fs'),
	sc = require('../stocktonCompiler'),
	datn = require('../debugATN.js'),
	Compiler = sc.Compiler,
	srt = require('../stocktonRuntime.js'),
	cycle = require('cycle'),
	PredictionContext  = srt.PredictionContext;


var str = fs.readFileSync('./stockton-grammar.g', {encoding: 'utf-8'});
var parser = stGrammarParser.create(str);
parser.verbose();
var ast = parser.parse();

console.log(JSON.stringify(ast.result, null, '  '));

console.log('>>> test getStringFromGrammarStringLiteral()');
var escaped = Compiler.getStringFromGrammarStringLiteral(
	'\'this is new line:\\n, this is tab: \\t, this is "\\\\u0061": \\u0061\'');
console.log(escaped);

var compiler = new Compiler();
var atn0 = compiler.compile(str);
//compiler.debugATN();
console.log('atn: %j', atn0);
var atn = cycle.retrocycle(atn0);
datn.debugATN(atn);

var scanToken = srt.generateLexer(atn);

var parser = new LL.Parser('abc xyz', scanToken, {});
parser.la();

console.log('EmptyPredictionContext %j ', PredictionContext.EMPTY);
console.log('compiler.atn.maxTokenType=%d', compiler.atn.maxTokenType);




