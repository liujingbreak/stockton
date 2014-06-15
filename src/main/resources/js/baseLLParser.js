

var EOF = -1;

function mixin(target, obj){
	for(f in obj){
		target[f] = obj[f];
	}
}
if (typeof Object.create != 'function') {
    (function () {
        var F = function () {};
        Object.create = function (o) {
            if (arguments.length > 1) { throw Error('Second argument not supported');}
            if (o === null) { throw Error('Cannot set a null [[Prototype]]');}
            if (typeof o != 'object') { throw TypeError('Argument must be an object');}
            F.prototype = o;
            return new F;
        };
    })();
}
function extend(subclass, superclass, override){
	subclass.prototype = Object.create(superclass.prototype);
	subclass._super = superclass.prototype;
	subclass.superclass = superclass;
	mixin(subclass.prototype, override);
}
function UnexpectLex(attr){
    mixin(this, attr);
}
extend(UnexpectLex, Error);

var baseRecog = {
    
};

function Lexer(str, callback){
    this.offset = 0;
    this.lineno = 1;
    this.col = 1;
    
    this.startOff = this.offset;
    this.startLine = this.lineno;
    this.startCol = this.col;
    
    this.input = new Array(str.length);
    this.startToken = null;
    this.lastToken = null;
    this.tokenIndex = 0;
    this.callback = callback;
    this.types = {'-1': EOF};
    this.typeIdx = 0;
    this.typeNames = [];
    //this.nextChar = null;
    for(var i = 0, l = str.length; i<l; i++){
        this.input[i] = str.charAt(i);
    }
}
exports.Lexer = Lexer;
Lexer.prototype = {
    classname:'Lexer',
    EOF: EOF,
    moreToken:function(){
        try{
            var c = this.la();
            if(c == EOF){
                this.emitToken(EOF);
                return;
            }
            if(this.callback)
                this.callback(this, this, c);
            else
                throw new Error('not implemented');
        }catch(e){
            if(e instanceof UnexpectLex){
                console.log('Lexer fails due to above exception');
            }
            //todo handle expection
            throw e;
        }
    },
    
    bnfLoop:function(predFunc, subRule){
        if(subRule === undefined)
            subRule = this.advance;
        while(this.la() != EOF){
            var pred = predFunc.call(this, this);
            if(pred === undefined){
                throw new Error('predicate function must return boolean value');
            }
            if(!pred)
                break;
            subRule.call(this);
        }
    },
    next:function(){
        var c = this.la(1);
        this.advance();
        return c;
    },
    advance:function(num){
        if(num === undefined)
            num = 1;
        for(var i = num; i; i--){
            
            if( this.input[this.offset] == '\n'){
                this.lineno++;
                this.col = 1;
            }else if(this.input[this.offset] != '\r'){
                this.col++;
            }
            this.offset++;
            
        }
        //console.log('advance offset=%d', this.offset);
    },
    unexpect:function(chr){
        if(chr == EOF)
            chr = 'EOF';
        console.log('unexpect char at line '+ this.lineno + ', offset '+ this.offset + 
            ' "'+ chr + '"');
        throw new UnexpectLex({chr: chr, lineno: this.lineno, offset: this.offset});
    },
    /** look ahead
    @param index starts from 1, default 1
    */
    la:function(index){
        if(index === undefined)
            index = 1;
        var pos = this.offset + index - 1;
        if( pos >= this.input.length)
            return EOF;
        //console.log('la() this=%s, offset=%d, pos=%d', this.classname,this.offset, pos);
        return this.input[pos];
    },
    isNext:function(c, c2, c3){
        for(var i = 1, l = arguments.length; i<= l; i++){
            if(this.la(i) != arguments[i - 1 ])
                return false;
        }
        return true;
    },
    
    unknown:function(c){
        if(this._unknown == null)
            this._unknown = c;
        else
            this._unknown += c;
    },
    
    /**
    @param stype token type name
    @param channel default channel is 0, if you want to indicate this token as skipped token like white space, put it as any number other than 0
    */
    emitToken:function(stype, channel, startOff, startLine, endOff, endLine, startCol, endCol){
        if(startOff === undefined){
            startOff = this.startOff;
            startLine = this.startLine;
            startCol = this.startCol;
            endOff = this.offset;
            endLine = this.lineno;
            endCol = this.col;
        }
        if(channel === undefined)
            channel = 0;
        var token = new Token({
            type:this._tokenType(stype), 
            pos:[startOff, endOff, startLine, endLine, startCol, endCol],
            idx: this.tokenIndex++,
            channel: channel,
            prev: this.lastToken,
            next:null
        }, this);
        //console.log('# emit %s %j', stype, token.pos);
        if(this.lastToken)
            this.lastToken.next = token;
        this.lastToken = token;
        if(!this.startToken)
            this.startToken = token;
        this.startOff = this.offset;
        this.startLine = this.lineno;
        this.startCol = this.col;
        
    },
    
    text:function(token){
        var pos = token.pos;
        return this.input.slice(pos[0], pos[1]).join('');
    },
    
    _tokenType:function(stype){
        if(stype in this.types)
            return this.types[stype];
        var n = this.types[stype] = this.typeIdx ++;
        this.typeNames[n] = stype;
        return n;
    }
};

function Token(json, lexer){
    mixin(this, json);
    this.lexer = lexer;
}
Token.prototype = {
    typeName:function(){
        if(this.type == EOF)
            return 'EOF';
        return this.lexer.typeNames[this.type];
    },
    text:function(){
        return this.lexer.text(this);
    },
    toString:function(){
        return JSON.stringify({
                type: this.type,
                typeName: this.typeName(),
                channel: this.channel,
                idx: this.idx,
                pos: this.position2str(),
                text: this.text()
        }, null, '  ');
    },
    position2str:function(){
        return ' [offset '+ this.pos[0] +' - '+ this.pos[1] +
        '], [line '+ this.pos[2] +' - '+ this.pos[3] +
        '], [columen '+ this.pos[4] +' - '+ this.pos[5]+ ']';
    }
}

function Parser(str, lexerCallback, channel){
    this.lexer = new Lexer(str, lexerCallback);
    this.currIdx = null;
    this.channel = channel === undefined? 0 : channel;
}
exports.Parser = Parser;
Parser.prototype = {
    classname:'Parser',
    defTokenTypes:function(type1, type2, typeN){
        for(var i=0, l=arguments.length;i<l; i++)
            this.lexer._tokenType(arguments[i]);
    },
    typeName:function(nType){
        if(nType == EOF)
            return 'EOF';
        return this.lexer.typeNames[nType];
    },
    tokenType:function(sType){
        return this.lexer.types[sType];
    },
    
    nextToken:function(){
        if(!this._next){
            this.lexer.moreToken();
            this._next = this.lexer.startToken;
        }else{
            if(!this._next.next)
                this.lexer.moreToken();
            this._next = this._next.next;
        }
        return this._next;
    },
    la:function(index){
        if(index === undefined)
            index = 1;
        if(!this._next){
            this.lexer.moreToken();
            this._next = this.lexer.startToken;
        }
        //console.log©250('this._next %s %j', this.typeName(this._next.type), this._next.pos); 
        var next = this._next;
        for(var i = index -1; i; i--){
            if(next.type == EOF)
                return next;
            if(!next.next)
                this.lexer.moreToken();
            next = next.next;
            if(next.channel !== this.channel)
                i++;//more rounds
        }
        return next;
    },
    
    isTokens:function(typeName1, typeName2, typeName3){
        var types = arguments;
        return this._isTypes.call(this, function(i){
                //console.log(this.lexer.types);
                //console.log('test type %s', types[i]);
                return this.tokenType(types[i]);
            }, arguments.length);
    },
    
    _isTypes:function(typesCallback, typesNum){
        if(!this._next){
            this.lexer.moreToken();
            this._next = this.lexer.startToken;
        }
        var next = this._next;
        for(var i =0, l = typesNum; i<l; i++){
            var ntype = typesCallback.call(this, i);
            if(next.channel !== this.channel){
                i++;//more rounds
                continue;
            }
            if(next.type != ntype){
                console.log('Not found: next.type=%s\n\texpect=%s', 
                    next, this.typeName(ntype));
                return false;
            }
            if(next.type == EOF){
                return i == l-1;
            }
            if(!next.next)
                this.lexer.moreToken();
            next = next.next;
            
        }
        return true;
    },
    
    bnfLoop:function(predFunc, subRule){
        if(subRule === undefined)
            subRule = this.advance;
        while(this.la().type != EOF){
            var pred = predFunc.call(this, this);
            if(pred === undefined){
                throw new Error('predicate function must return boolean value');
            }
            if(!pred)
                break;
            subRule.call(this);
        }
    },
    
    advance:function(num){
        if(num === undefined)
            num = 1;
        var last;
        for(var i = num; i; i--){
            last = this.nextToken();
            if( last.channel !== this.channel)
                i++;
        }
        return last;
    },
    
    textOf:function(token){
        return this.lexer.text(token);
    }
};

