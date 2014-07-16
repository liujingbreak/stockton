var LL = require('./baseLLParser.js');

/**
tokens:
START, WS
*/
var SKIP = 1;
function scanToken(lex){
	var other = false;
	var c = lex.la();
	if(lex.tokenIndex == 0 && c.predString('/*')){
		lex.advance(2);
		if(c.predChar('*'))
			lex.advance();
		lex.emitToken('START', SKIP);
		return;
	}
	switch(c){
		case ' ':
		case '\t':
		case '\f':
		case '\r':
		case '\n':
			lex.advance();
			lex.emitToken('WS');
			break;
		case '*':
			if(lex.lb() === '\n' || lex.lb() === '\r'){
				lex.advance();
				lex.bnfLoop(0, function(){ return lex.la() === '*';},
					function(){
						lex.advance();
					});
				lex.emitToken("WS");
			}else{
				lex.advance();
				lex.emitToken(c);
			}
			break;
		case '@':
			lex.advance();
			c = lex.la();
			if(isWord(c) || isNumber(c) || c === '_' )
				id(lex);
			break;
		default:
			other = true;
	}
	if(!other) return;
}

function isWord(c){
	return c >= 'a' && c<= 'z' || c >= 'A' && c<= 'Z';
}
function isNumber(c){
	return c >= '0' && c <= '9';
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
    //if(text in keywordMap)
    //		lex.emitToken(text);
    //	else
    	lex.emitToken('id');
}
var grammar = {
	root:function(){
		this.bnfLoop(0, function(){return true;},
			function(){
				this.advance();
			});
		this.match('EOF');
	}
};

exports.create = function(text){
    var parser = new LL.Parser(text, scanToken, grammar);
    
    parser.parse = function(){
    		return parser.rule("root");
    }
};
