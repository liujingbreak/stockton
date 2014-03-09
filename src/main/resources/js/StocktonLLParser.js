

var EOF = -1;
var EOL_CODE = '\n'.charCodeAt(0);

function Lexer(text){
	this.text = text;
	this.lineno = 1;
	this.column = 0;
	this.offset = 0;
	this.currChar = this.chr(0);
}
Lexer.prototype = {
	chr:function(offset){
		if(offset == null){
			offset = this.offset;
		}
		if(this.offset < this.text.length){
			return this.text.charCodeAt(offset);
		}else{
			return EOF;
		}
		
	},
	advance:function(){
		this.offset++;
		if(this.currChar == EOL_CODE)
		this.currChar = this.chr();
		this.column++;
	},
	nextToken:function(){
		
	},
	/** look ahead, 1 based */
	LA:function(i){
		if(i < 1)
			throw new Error('Invalid LA() argument value: '+ i + ', must be bigger than 0');
		if(i == 1){
			return this.currChar;
		}else{
			return this.chr(this.offset + i -1);
		}
	}
};

var states = [];
var startState = {
	next:[]
};
function createStopState(rule){
	return {
		stop:true,
		rule: rule
	};
}

function buildDFA(rules){
	for(var i =0, l=rules.length; i<l; i++){
		var state = createStopState(rules[i]);
		states.push(state);
		startState.next.push(state);
	}
	
}

function rules2DFA(startRule){
	traverseRuleTree(startRule);
}
function traverseRuleTree(rule){
	switch(rule.type){
	case 'branch':
		break;
	case 'loop':
			rule.startState = currState;
		break;
	case 'range':
		break;
	case 'neg':
		break;
	default:
		
	}
}



