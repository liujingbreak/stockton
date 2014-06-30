var LL = require('../baseLLParser.js');
var fs = require('fs');

var str = fs.readFileSync('./test2.less', {encoding: 'utf-8'});

var lessParserLib = require('../less-parser.js');
var parser = lessParserLib.create(str);
    parser.verbose();
var r = parser.parse().result;
debugger;

console.log(JSON.stringify(r, null, '  '));

//do{
//    var token = this.nextToken();
//    if(token.type != this.tokenType('WS'))
//        console.log('token: %s', token);
//}while(token.type != -1);

/* console.log('la() %s', this.la());
console.log('la(2) %s', this.la(2));
console.log('la(3) %s', this.la(3));
console.log('la(4) %s', this.la(4));
console.log('la(5) %s', this.la(5));
var assert = require('assert');
// assert(this.predToken('comment'));
assert(this.predToken('comment', 'ID', '{'));
this.advance(2);
console.log('----------\nla() %s ', this.la());
assert(this.predToken('{', 'ID'));
this.advance();
assert(this.predToken( 'ID')); */


/*

var handler = {
  param: null,
  callback: function(i){
    return this.param[i];
  }
};

function run2(handler){
    return 's' + handler.callback(0);
}

function run1(callback){
    return 's' + callback(0);
}
function test(typeName1, typeName2, typeName3){
        var types = arguments;
        return run1.call(this, function(i){
                return types[i];
            });
}
function test2(typeName1, typeName2, typeName3){
        handler.param = arguments;
  return run2.call(this, handler);
}

var start = new Date().getTime();
for(var i =0;i<1000000;i++){
    test('1','2','3');
}
console.log('duration of test 1 %s', (new Date().getTime() - start) );


start = new Date().getTime();
for(var i =0;i<1000000;i++){
    test2('1','2','3');
}
console.log('duration of test 2 %s', (new Date().getTime() - start) );
*/
