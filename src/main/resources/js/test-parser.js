var pegParser = require('./javascript-parser.js');
var fs = require('fs');
var parers = require('./stockton-parsers.js');

var text = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'});
console.log(JSON.stringify(process.memoryUsage()));
var parser = new parers.JSParser(pegParser, console.log);
console.log(JSON.stringify(parser.parse(text), null, "  "));
console.log(JSON.stringify(process.memoryUsage()));
