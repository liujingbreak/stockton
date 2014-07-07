var LL = require('./baseLLParser.js');

function scanToken(lex){
    var other = false;
    var c = lex.la();
    switch(c){
    case ' ':
    case '\t':
    case '\r':
    case '\f':
    case '\\':
        lex.advance();
            lex.bnfLoop(0, function(){
                    var c = lex.la();
                    return c == ' ' || c == '\t' || c == '\r';
            });
        lex.emitToken('WS', 1);
        break;
    case '/':
        if(this.la(2) == '*')
            comment(lex);
        else if(this.la(2) == '/')
            lineComment(lex);
        else if(isReguarExpress(lex))
            regex(lex);
        else{
            lex.advance();
            lex.emitToken(c);
        }
        break;
    case '"':
    case "'":
        stringLit(lex);
        break;
    case '[':
    case ']':
    case '{':
    case '}':
    case '(':
    case ')':
        lex.advance();
        lex.emitToken(c);
        break;
    case '-':
    case '.':
        number(lex);
    default:
        other = true;
    }
    if(!other) return;
    if(c >= '0' && c<= '9'){
        number(lex);
    }else if(c >= 'a' && c<= 'z' || c >= 'A' && c <= 'Z' || c === '_' || c === '$'){
        id(lex);
    }
}
function stringLit(lex){
    var start = lex.la();
    lex.advance();
    if(lex.predChar(start, start)){
        tripleQuote(lex);
        return;
    }
    lex.bnfLoop(0, function(){
            return lex.la() != start;
    }, function(){
        var c = this.la();
        if(c == '\\')
            this.advance();
        else if(c === '\n')
            this.unexpect('"\n" in string literal');
        this.advance();
    });
    lex.advance();
    lex.emitToken('stringLit');
}

function tripleQuote(lex){
    var startChar = lex.advance(2);
    lex.bnfLoop(0, function(){
            return !lex.predChar(startChar, startChar, startChar);
    }, function(){
        var c = this.la();
        if(c == '\\')
            this.advance();
        this.advance();
    });
    lex.advance(3);
    lex.emitToken('stringLit');
}

function comment(lex){
    var channel = 1;
    lex.advance(2);
    var content = '', type = 'comment';
    if(lex.la() == '*' && lex.la(2) != '/'){
        type = 'doc';
        channel = 2;
        lex.advance();
    }
    
    lex.bnfLoop(0, function(){
            return !this.predChar('*', '/');
    }, function(){
        content += lex.advance();
    });
    lex.advance(2);
    var t = lex.emitToken(type, channel);
    t.text(content);
}

function lineComment(lex){
    lex.advance(2);
    var content = '';
    lex.bnfLoop(0, function(){
            return this.la() != '\n';
    }, function(){
        content += lex.advance();
    });
    lex.advance();
    var t = lex.emitToken('comment', 1);
    t.text(content);
}

function isReguarExpress(lex){
    switch(lex.lastToken.type){
    case 'id':
    case 'null':
    case 'bool':
    case 'this':
    case 'number':
    case 'stringLit':
    case ']':
    case ')':
        return false;
    default:
        return true;
    }
}

function regex(lex){
    lex.advance();
    lex.bnfLoop(1, function(){
            return this.la() != '/';
    }, function(){
        if(this.la() == '\\')
            this.advance();
        this.advance();
    });
    lex.match('/');
    lex.emitToken('regex');
}

function id(lex){
    var text = lex.advance();
    lex.bnfLoop(0, function(){
    			
            var c = this.la();
            return c >= 'a' && c<= 'z' || c >= 'A' && c <= 'Z' || c === '_' || 
                c === '$' || c >= '0' && c <= '9';
    }, function(){
        text += this.advance();
    });
    lex.emitToken('id');
}

var numberSuffix = {'f':true, 'F':true, 'd':true, 'D':true};

var HEX_CHAR = {'a':true, A:true, B:true, 'b':true, C:true, c:true, 'd':true, 'D':true, e:true, E:true, f:true, F:true};

function number(lex){
    var d = lex.advance();
    if(d === '0' && lex.la() === 'x'){
        hex(lex);
        return;
    }else if(d >= '0' && d <= '9'){
        lex.bnfLoop(0, function(){
                var c = this.la();
                return c >= '0' && c<= '9';
        });
    }else if(d === '-'){
    		lex.advance();
    }
    if(lex.la() == '.')
        lex.advance();
    lex.bnfLoop(0, function(){
            var c = this.la();
            return c >= '0' && c<= '9';
    });
    var c = lex.la();
    if(c in numberSuffix)
        lex.advance();
    lex.emitToken('number');
}

function hex(lex){
    lex.advance();
    lex.bnfLoop(2, function(){
            var c = this.la();
            return c >= '0' && c <= '9' || c in HEX_CHAR;
    });
    lex.emitToken('number');
}

var grammar = {
    root: function(){
        this.bnfLoop(0, function(){return true;});
        this.match('EOF');
    }
};
exports.create = function(text){
    var parser = new LL.Parser(text, scanToken, grammar);
    parser.parse = function(){
    		return parser.rule("root");
    }
    return parser;
};
