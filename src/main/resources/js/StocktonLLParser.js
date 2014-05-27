

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

exports.Lexer = function Lexer(str){
    this.offset = 0;
    this.lineno = 1;
    this.col = 1;
    this.input = new Array(str.length);
    
    for(var i = 0, l = str.length; i<l; i++){
        this.input[i] = str.charAt(i);
    }
}
Lexer.prototype = {
    next:function(){
        var c = this.la(1);
        this.consume();
        return c;
    },
    consume:function(){
        this.offset ++;
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
        return this.input[pos];
    },
    nextToken:function(){
        //
        throw new Error('not implemented');
    }
};

function Parser(lexer){
    this.lexer = lexer;
}
exports.Parser = Parser;
Parser.prototype = {
    
};
