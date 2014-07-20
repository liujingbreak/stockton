var LL = require('../stockton-grammar-parser.js')
	, util = require('util')
    ,fs = require('fs');
    
var str = fs.readFileSync('./stockton-grammar.g', {encoding: 'utf-8'});
var parser = LL.create(str);
parser.verbose();
var ast = parser.parse();
debugger;
console.log(JSON.stringify(ast.result, null, '  '));
