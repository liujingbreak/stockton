var grmParser = require('./stockton-grammar-parser.js'),
	_ = require("./underscore-min.js"),
	stUtil = require('./stockton-util.js'),
	RangeUtil = stUtil.RangeUtil;


function compile(text){
	return new Compiler().compile(text);
	
	
}
var _stateType = 0;
var stateName2Type = {
	altsEnd: _stateType++,
	decision: _stateType++,
	altsStart:		 _stateType++,
	basicAltsStart:  _stateType++,
	plusAltsStart:   _stateType++,
	starAltsStart:   _stateType++,
	plusLoopBack:    _stateType++,
	starLoopEntry:   _stateType++,
	tokenStart:      _stateType++,
	loopEnd:         _stateType++,
	ruleStart:       _stateType++,
	ruleStop:        _stateType++,
	starLoopBack:    _stateType++
};

function Compiler(){
	this.lexRuleASTMap = {};
	this.lexRuleASTs = [];
	this.lexStartState = buildState();
	this.lexRuleStates = [];
	this.lexState = this.lexStartState;
	this.currentRuleName = null;
	this.atn = {};
}

Compiler.prototype = {
	
	compile:function(text){
		var parser = grmParser.create(text);
		var ast = parser.parse().result;
		ast.forEach(function(ruleAst){
			if(ruleAst.type == 'lexRule'){
				this.lexRuleASTMap[ruleAst.name] = ruleAst;
				this.lexRuleASTs.push(ruleAst);
				if(!ruleAst.fragment){
					console.log(ruleAst.name);
				}
				
			}
		}, this);
		this._createATN();
	},
	
	_createATN:function(){
		this.createRuleStartAndStopATNStates();
		this.lexRuleASTs.forEach(function(ruleAST){
				this.currentRuleName = ruleAST.name;
				buildLexerATN(ruleAST);
		}, this);
	},
	createRuleStartAndStopATNStates:function(){
		this.atn.ruleToStartState = {};
		this.atn.ruleToStopState = {};
		this.lexRuleASTs.forEach(function(ruleAST){
				var start = this.newState('ruleStart', ruleAST);
				var stop = this.newState('ruleStop', ruleAST);
				start.stopState = stop;
				//start.isPrecedenceRule = r instanceof LeftRecursiveRule;
				start.ruleName = ruleAST.name;
				stop.ruleName = ruleAST.name;
				this.atn.ruleToStartState[ruleAST.name] = start;
				this.atn.ruleToStopState[ruleAST.name] = start;
		}, this);
	},
	/**
	@param type: basic, ruleStart
	*/
	newState:function(type){
		return new ATNState(type);
	},
	/* newTransition:funciton(type, targetState){
		return { type: type, target: targetState };
	} */
	/**
	transition's properties:
	{
		type - 'la'/'rule', 
		v - the char
		state - the next state
	}
	*/
	buildLexerATN:function(ast, state){
		if(typeof(ast) === 'string'){//stringlit
			var left = this.newState('basic');
			var prev = left;
			var right;
			for (var i=0,l=ast.length; i<l; i++) {
				right = this.newState('basic');
				prev.addTransition({type: 'atom', target:right, label: ast.charAt(i)});
				prev = right;
			}
			return {left: left, right: right};
		}
		switch(ast.type){
			case 'range':
				var left = this.newState('basic', ast);
				var right = this.newState('basic', ast);
				left.addTransition({type:'range', from: t1, to: t2});
				return {left:left, right:right};
			case 'not':
			case 'wildcard':
			case '*':
			case '+':
			case '?':
			case 'label':
			case 'alts':
			case 'tokenRef':
				if(ast.name == 'EOF'){
					var left = this.newState('basic', ast);
					var right = this.newState('basic', ast);
					left.addTransition({type: 'atom', target:right, label:'EOF'});
					return {left: left, right: right};
				}else{
					var ruleAST = this.lexRuleASTMap[ast.name];
					if(ruleAST == null){
						console.log("undefined rule: "+ ast.name);
						return null;
					}
					var start = this.atn.ruleToStartState[ast.name];
					var left = this.newState('basic');
					var right = this.newState('basic');
					var call = {type:'rule', ruleName:ast.name, target: right};
					left.addTransition(call);
					return {left:left, right: right};
				}
		}
	},
	buildLexerATN_child:function(ast, state){
		var ch = ast.child;
		for(var i=0,l=ch.length; i<l; i++){
			buildLexerATN(ch[i], state);
		}
	}
}
function ATNState(type){
	this.type = type;
	this.transitions = [];
	this.epsilonOnlyTransitions = false;
}
ATNState.prototype = {
	addTransition:function(t){
		if(this.transitions.length == 0)
			this.epsilonOnlyTransitions = (t.type == 'epsilon');
		else if(this.epsilonOnlyTransitions != (t.type == 'epsilon')){
			this.epsilonOnlyTransitions = false;
			console.log('ATN state %s has both epsilon and non-epsilon transitions.', this.type);
		}
		this.transitions.push(t);
	}
};

function ATNBuilder(compiler){
}
ATNBuilder.prototype = {
	ruleBlock:function(ast){
		var alts = _.find(ast.child, function(){
				return c.type === 'alts';
		});
		
		alts.child.forEach(function(alt){
				this.alternative(alt);
		}, this);
	},
	alternative:function(ast){
		
	}
};
module.exports = compile;
