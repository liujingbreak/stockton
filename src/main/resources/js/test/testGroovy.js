var LL = require('../groovy-parser.js')
    ,fs = require('fs');
    
var str = fs.readFileSync('./test.groovy', {encoding: 'utf-8'});
var parser = LL.create(str);
parser.verbose();
var ast = parser.parse();

console.log(JSON.stringify(ast, null, '  '));
