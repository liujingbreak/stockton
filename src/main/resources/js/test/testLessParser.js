var LL = require('../baseLLParser.js');
var fs = require('fs');

var str = fs.readFileSync('./test.less', {encoding: 'utf-8'});



var grammar = {
    root:function(){
        this.rule('content', 'EOF');
        this.expect('EOF');
    },
    
    content:function (endType){
        var ret = [];
        this.bnfLoop(0, function(){
                return !this.predToken(endType);
        }, function(){
            if(this.predToken('varname'))
                ret.push( this.rule('cssRule') );
            else if(this.predRule('style')){
                this.rule('style');
            }else if(this.inTokens(';')){
                this.log('WARNING: bad format '+ this.la());
                this.advance();
            }else{
                ret.push(this.rule('cssSelector'));
            }
        });
        return ret;
    },
    
    
    cssSelector:function (){
        
        var sel = this.rule('selector');
        if(!this.isPredict())
            this.log('[cssSelector] %s', this.ruleText());
        this.expect('{');
        this.rule('content', '}');
        this.expect('}');
    },
    
    
    style:function(){
        var prop = this.rule('property');
        this.expect(':');
        var val = this.rule('value');
        if(this.predToken(';')){
            this.advance();
        }else if(this.inTokens('}', 'EOF')){
            this.log('WARNING: expect ";", bad format at ' + this.la());
        }else{
            this.unexpect(this.la());
        }
    },
    
    property:function(){
        this.bnfLoop(1, function(){
                return !this.inTokens(':', '{', '}', 'EOF', ';');
        });
        return this.ruleText();
    },
    
    value:function(){
        this.bnfLoop(0, function(){
                return !this.inTokens(';', '{','}');
        });
        return this.ruleText();
    },
    
    selector: function(){
        
        this.bnfLoop(1, function(){
                return ! this.inTokens('{', '}', ';');
        });
        return this.ruleText();
    },
    
    cssRule:function (){
        this.expect('varname');
        if(this.predToken('{')){
            if(!this.isPredict())
                this.log('[cssRule] %s', this.ruleText());
            this.advance();
            this.rule('content', '}');
            this.expect('}');
        }else if(this.predToken(':')){
            this.advance();
            this.bnfLoop(0, function(){
                    return !this.inTokens(';','{');
            });
            if(!this.isPredict())
                this.log('[cssRule] %s', this.ruleText());
            if(this.predToken('{')){
                this.advance();
                this.rule('content', '}');
                this.expect('}');
            }else{
                this.expect(';');
            }
        }
        
    }
};

var parser = new LL.Parser(str, function(lex){
    var c = this.la();
    if(c == '/'){
        if(this.la(2) == '*')
            comment.call(this, lex);
        else if(this.la(2) == '/')
            lineComment(lex);
    }
    else if( isID(c)){
        ID(lex);
    }else if(c == '.' && ( isID(this.la(2)) )){
        className(lex);
    }else if(c == '"' || c == "'"){
        stringLit(lex);
    }else if(c == ' ' || c == '\n' || c == '\t' || c == '\r'){
        lex.advance();
        lex.bnfLoop(0, function(){
                var c = lex.la();
                return c == ' ' || c == '\n' || c == '\t' || c == '\r';
        });
        lex.emitToken('WS', 1);
    }else if(c == '@'){
        varname(lex);
    }else{
        switch(c){
        case '#':
        case '=':
        case '{':
        case '}':
        case ';':
        case ':':
            lex.advance();
            lex.emitToken(c);
            break;
        default:
            lex.advance();
            lex.emitToken('[*]');
        }
    }
}, grammar);

function varname(lex){
    lex.advance();
    lex.bnfLoop(0, function(){
            return isID(lex.la());
    });
    lex.emitToken('varname');
}

function ID(lex){
    lex.advance();
    lex.bnfLoop(0, function(){
            return isID(lex.la());
    });
    lex.emitToken('ID');
}

function className(lex){
    //console.log('classname %d', lex.offset);
    lex.advance(2);
    lex.bnfLoop(0, function(){
        return isID(lex.la())
    });
    //console.log('classname end %d', lex.offset);
    lex.emitToken('className');
}

function stringLit(lex){
    var start = lex.la();
    lex.advance();
    lex.bnfLoop(0, function(){
            return lex.la() != start;
    }, function(){
        var c = this.la();
        if(c == '\\')
            this.advance();
        this.advance();
    });
    lex.advance();
    lex.emitToken('stringLit');
}

function comment(lex){
    lex.advance(2);
    lex.bnfLoop(0, function(){
            return !this.predChar('*', '/');
    });
    lex.advance(2);
    lex.emitToken('comment', 1);
}

function lineComment(lex){
    lex.advance(2);
    lex.bnfLoop(0, function(){
            return this.la() != '\n';
    });
    lex.advance();
    lex.emitToken('comment', 1);
}

function isLetter(c){
    return  (c >= 'a' && c<= 'z') || ( c >= 'A' && c <= 'Z');
}

function isNum(c){
    return  (c >= '0' && c<= '9');
}

function isID(c){
    return isLetter(c) || isNum(c) || c == '-' || c == '_';
}

parser.rule('root');
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
