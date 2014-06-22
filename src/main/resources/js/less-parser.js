var LL = require('./baseLLParser.js');

var grammar = {
    /** list of automatically build AST (abstract syntax tree)
    each name must matches defined rule name, the list will contains name of every parser rule defined by user,
    it means that parser will build all types of AST by name of parser rules by default
    */
    AST:['cssRule', 'cssSelector','style'],
    
    root:function(){
        var c = this.rule('content', 'EOF');
        this.match('EOF');
        return c.child;
    },
    
    content:function (endType){
        this.bnfLoop(0, function(){
                return !this.predToken(endType);
        }, function(){
            if(this.predToken('varname'))
                this.rule('cssRule');
            else if(this.predRule('style')){
                this.rule('style');
            }else if(this.inTokens(';')){
                this.log('WARNING: bad format '+ this.la());
                this.advance();
            }else{
                this.rule('cssSelector');
            }
        });
    },
    
    
    cssSelector:function (){
        
        var sel = this.rule('selector');
        
        if(this.predToken('(')){
            this.advance();
            var params = '';
            this.bnfLoop(0, function(){
                    return !this.predToken(')');
            }, function(){
                params += this.advance().text();
            });
            this.log('params='+ params);
            this.match(')');
            if(this.predToken(';')){
                this.advance();
                return {type:'functionCall', name: sel + '('+ params +')'};
            }else{
                this.log('[cssSelector func def] '+ this.ruleText());
                this.match('{');
                var content = this.rule('content', '}');
                this.match('}');
                return {type:'functionDef', name: sel + '('+ params +')', child:content};
            }
        }else{
            this.match('{');
            var content = this.rule('content', '}');
            this.match('}');
            return {type:'cssSelector', name:sel, child: content};
        }
    },
    
    
    style:function(){
        var prop = this.rule('property');
        this.match(':');
        var val = this.rule('value');
        if(this.predToken(';')){
            this.advance();
        }else if(this.inTokens('}', 'EOF')){
            this.log('WARNING: expect ";", bad format at ' + this.la());
        }else{
            this.unexpect(this.la());
        }
        return null;
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
                return ! this.inTokens('{', '}','(',')', ';');
        });
        
        return this.ruleText();
    },
    
    /** type: rule/variable */
    cssRule:function (){
        var name = this.match('varname');
        if(this.predToken('{')){
            if(!this.isPredicate())
                this.log('[cssRule] '+ this.ruleText());
            this.advance();
            var content = this.rule('content', '}');
            this.match('}');
            return {
                type:'rule',
                name: name,
                child: content
            };
        }else if(this.predToken(':')){
            this.advance();
            this.bnfLoop(0, function(){
                    return !this.inTokens(';','{');
            });
            if(!this.isPredicate())
                this.log('[cssRule] '+ this.ruleText());
            name = this.ruleText();
            if(this.predToken('{')){
                this.advance();
                var content = this.rule('content', '}');
                this.match('}');
                return { type:'rule',
                    name: name,
                    child: content
                };
            }else{
                this.match(';');
                return { type: 'variableDef', name: name };
            }
        }
        
    }
};

exports.create = function(str){
    
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
            case '(':
            case ')':
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
    parser.setListener({
            ruleIn:function(name){
                //this.log(' >'+ name);
            },
            ruleOut:function(name){
                //this.log(name + '>');
            },
            ast:function(ast, stack){
                if(ast.type != null){
                    ast.start = stack.startToken.pos[0];
                    ast.stop = stack.stopToken.pos[1];
                }
                return ast;
            }
    });
    /**
    parse
    */
    parser.parse = function(){
        var ret = this.rule('root');
        return ret;
    }
    return parser;
}
