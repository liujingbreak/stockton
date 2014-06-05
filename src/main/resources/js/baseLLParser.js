

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
    this.startOff = this.offset;
    this.startLine = this.lineno;
    this.col = 1;
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
    
    bnfStar:function(predFunc, subRule){
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
    bnfQuest:function(){
    },
    bnfPlus:function(){
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
            if( this.input[this.offset++] == '\n')
                this.lineno++;
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
    isLa:function(c, c2, c3){
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
    
    emitToken:function(stype, startOff, startLine, endOff, endLine){
        /* if(this._unknown != null){
            this._unknown = null;
            debugger;
            this.emitToken('_UNKNOWN');
        } */
        if(startOff === undefined){
            startOff = this.startOff;
            startLine = this.startLine;
            endOff = this.offset;
            endLine = this.lineno;
        }
        var token = {
            type:this._tokenType(stype), 
            pos:[startOff, startLine, endOff, endLine],
            idx: this.tokenIndex++,
            prev: this.lastToken,
            next:null
        };
        //console.log('emit '+ type);
        if(this.lastToken)
            this.lastToken.next = token;
        this.lastToken = token;
        if(!this.startToken)
            this.startToken = token;
        this.startOff = this.offset;
        this.startLine = this.lineno;
    },
    
    text:function(token){
        var pos = token.pos;
        return this.input.slice(pos[0], pos[2]).join('');
    },
    
    _tokenType:function(stype){
        if(stype in this.types)
            return this.types[stype];
        var n = this.types[stype] = this.typeIdx ++;
        this.typeNames[n] = stype;
        return n;
    }
};

function Parser(str, lexerCallback){
    this.lexer = new Lexer(str, lexerCallback);
    this.currIdx = null;
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
        debugger;
        if(!this._next){
            this.lexer.moreToken();
            this._next = this.lexer.startToken;
        }else if(!this._next.next){
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
        console.log('this._next %s %j', this.typeName(this._next.type), this._next.pos); 
        var next = this._next;
        for(var i = index -1; i; i--){
            debugger;
            if(this._next.type == EOF)
                return this._next;
            if(!next.next)
                this.lexer.moreToken();
            next = next.next;
            console.log('next %d %s %j', i, this.typeName(next.type), next.pos);
        }
        console.log('return next %d %s %j', index, this.typeName(next.type), next.pos); 
        return next;
    },
    
    textOf:function(token){
        return this.lexer.text(token);
    }
};

