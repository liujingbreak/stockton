var LL = require('./baseLLParser.js');

function scanToken(lex){
    var other = false;
    var c = lex.la();
    switch(c){
    case ' ':
    case '\t':
    case '\r':
    case '\f':
    case '\n':
        lex.advance();
            lex.bnfLoop(0, function(){
                    var c = lex.la();
                    return c == ' ' || c == '\t' || c == '\r' || c === '\f' || c === '\n';
            });
        lex.emitToken('WS', 1);
        break;
    case '/':
        if(this.la(2) == '*')
            comment(lex);
        else if(this.la(2) == '/')
            lineComment(lex);
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
    case ')': case ':': case ';':
        lex.advance();
        lex.emitToken(c);
        break;
    case '-':
    case '.':
        number(lex);
        break;
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
	AST:[ 'rule'],
	
    root: function(){
        this.rule('blockContent', true);
        this.match('EOF');
    },
    blockContent: function(hasRule){
    		var s = [];
        this.bnfLoop(0, function(){ return !this.predToken('}')},
        function(){
            if(this.predToken('{')){
                this.rule('block');
            }else if(hasRule && this.predRule('isRule')){
                s.push(this.rule('rule').result);
            }else{
                this.rule('other');
            }
        });
        return s;
    },
    block: function(){
        this.advance();
        this.rule('blockContent', false);
        this.match('}');
        
    },
    
    rule:function(){
    		if(this.la().text() === 'protected')
    			this.advance();
        var name = this.match('id').text();
        this.log('NAME:'+ name);
        this.bnfLoop(0, function(){
                return this.inTokens("[");
        }, function(){
                this.advance();
                this.bnfLoop(0, function(){ return !this.predToken(']'); });
                this.match(']');
            }
        );
        if(this.predToken('options'))
        		this.rule('options');
        if(this.predToken('{')){
        		this.rule('block');
        }
        if(this.predToken('options'))
        		this.rule('options');
        this.match(':');
        this.bnfLoop(0, function(){
                return !this.predToken(';');
        }, function(){
        		if(this.predToken('{'))
        			this.rule('block');
        		else
        			this.advance();
        });
        this.match(';');
        return { type: 'rule', name: name };
    },

    isRule:function(){
    		this.log('isrule');
        if(this.predToken('id')){
        		if(this.la().text() === 'protected'){
        			this.log('pro');
        			this.advance();
        		}
        		var name = this.match('id');
        		this.log('name '+ name.text());
        }else
            return false;
         this.log('here');
        this.bnfLoop(0, function(){
                return this.inTokens("[");
        }, function(){
                this.advance();
                this.bnfLoop(0, function(){ return !this.predToken(']'); });
                this.match(']');
            }
        );
        if(this.predToken('options'))
        		this.rule('options');
        if(this.predToken('{')){
        		this.rule('block');
        }
        if(this.predToken('options'))
        		this.rule('options');
        this.match(':');
    },
    action:function(){
        this.match('@');
        this.match('id');
        this.rule('block');
        return null;
    },
    
    options:function(){
    		this.match('options');
    		this.rule('block');
    },
    
    other:function(){
    		this.advance();
    		return null;
    }
};
exports.create = function(text){
    var parser = new LL.Parser(text, scanToken, grammar);
    
    parser.parse = function(){
    		return parser.rule("root");
    }
    
    parser.onAST = function(stack, ast){
        if(!Array.isArray(ast)){
            ast.start = stack.startToken.pos[0];
            ast.stop = stack.stopToken.pos[1];
            ast.line = stack.startToken.pos[2];
        }
        
        return ast;
    }
    return parser;
};
