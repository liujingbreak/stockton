var LL = require('../baseLLParser.js');
var fs = require('fs');

var str = fs.readFileSync('./test.less', {encoding: 'utf-8'});

var parser = new LL.Parser(str, function(lex){
    var c = this.la();
    if(c == '/'){
        if(this.la(2) == '*')
            comment.call(this, lex);
        else if(this.la(2) == '/')
            lineComment(lex);
    }
    else if( isID(c)){
        tagName(lex);
    }else if(c == '.' && ( isID(this.la(2)) )){
        className(lex);
    }else if(c == '"' || c == "'"){
        stringLit(lex);
    }else if(c == ' ' || c == '\n' || c == '\t' || c == '\r'){
        lex.advance();
        lex.bnfLoop(function(){
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
            lex.advance();
            lex.emitToken(c);
            break;
        default:
            lex.advance();
            lex.emitToken('[*]');
        }
    }
});

function varname(lex){
    lex.advance();
    lex.bnf(function(){
            return isID(lex.la());
    });
    lex.emitToken('varname');
}

function tagName(lex){
    lex.advance();
    lex.bnfLoop(function(){
            return isID(lex.la());
    });
    lex.emitToken('ID');
}

function className(lex){
    //console.log('classname %d', lex.offset);
    lex.advance(2);
    lex.bnfLoop(function(){
        return isID(lex.la())
    });
    //console.log('classname end %d', lex.offset);
    lex.emitToken('className');
}

function stringLit(lex){
    var start = lex.la();
    lex.advance();
    lex.bnfLoop(function(){
            return lex.la() != start;
    }, function(){
        var c = this.la();
        if(c == '\\')
            this.advance();
        this.advance();
    });
    lex.emitToken('stringLit');
}

function comment(lex){
    lex.advance(2);
    lex.bnfLoop(function(){
            return !this.isNext('*', '/');
    });
    lex.advance(2);
    lex.emitToken('comment');
}

function lineComment(lex){
    lex.advance(2);
    lex.bnfLoop(function(){
            return this.la() != '\n';
    });
    lex.advance();
    lex.emitToken('comment');
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

function root(parser){
    return content(parser);
}

function content(parser){
    var ret = [];
    while(!parser.isTokens('EOF')){
        if(parser.isTokens('varname'))
            ret.push( variableDef(parser) );
        else if(parser.isTokens('ID') || parser.isTokens('#') || parser.isTokens('className')){
            ret.push(selector(parser));
        }
    }
    return ret;
}
//do{
//    var token = parser.nextToken();
//    if(token.type != parser.tokenType('WS'))
//        console.log('[%d] type: %s, line: %j \n%s', token.idx, parser.typeName(token.type), token.pos, parser.lexer.text(token));
//}while(token.type != -1);

//console.log('la() %s', parser.la());
//console.log('la(2) %s', parser.la(2));
//console.log('la(3) %s', parser.la(3));
//console.log('la(4) %s', parser.la(4));
//console.log('la(5) %s', parser.la(5));
var assert = require('assert');
// assert(parser.isTokens('comment'));
assert(parser.isTokens('comment', 'ID', '*'));
parser.advance(2);
console.log('----------\nla() %s ', parser.la());
assert(parser.isTokens('*', 'ID'));
parser.advance();
assert(parser.isTokens( 'ID'));


