var parser = require('./javascript-parser.js');
var fs = require('fs');

var text = fs.readFileSync('jedit-stockton.js', {encoding: 'UTF-8'});
//console.log(text);
var tree = parser.parse(text);

console.log(JSON.stringify(tree, null, '  '));
