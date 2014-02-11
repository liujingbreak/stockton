var pegParser = require('./javascript-parser.js');
var fs = require('fs');
var parers = require('./stockton-parsers.js');
var esprima = require('./esprima');

var text = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'});
console.log(JSON.stringify(process.memoryUsage()));
var startTime0 = new Date().getTime();
var parser = new parers.JSParser(pegParser, console.log);
var peg = parser.parse(text);
var pegusedTime = new Date().getTime() - startTime0;
console.log(JSON.stringify(peg, null, "  "));
console.log(JSON.stringify(process.memoryUsage()));

var startTime = new Date().getTime();
var esParser = new parers.EsJSParser(esprima, console.log);
var es = esParser.parse(text);
var esusedTime =  (new Date().getTime() - startTime);
console.log("esprima:\n"+JSON.stringify(es, null, '  '));
console.log("pegjs used time:" + pegusedTime);
console.log("esprima used time:" + esusedTime);

console.log(JSON.stringify(process.memoryUsage()));
