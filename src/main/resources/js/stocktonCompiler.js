var grmParser = require('./stockton-grammar-parser.js'),
	_ = require("./underscore-min.js"),
	stUtil = require('./stockton-util.js'),
	RangeUtil = stUtil.RangeUtil;


function compile(text){
	return new Compiler().compile(text);
	
	
}

function Compiler(){
	this.lexRuleMap = {};
	this.lexRules = []; // only contains non-protected/non-fragment rules
	this.lexStartState = buildState();
	this.lexState = this.lexStartState;
}

Compiler.prototype = {
	
	compile:function(text){
		var parser = grmParser.create(text);
		var ast = parser.parse().result;
		ast.forEach(function(ruleAst){
			if(ruleAst.type == 'lexRule'){
				this.lexRuleMap[ruleAst.name] = ruleAst;
				if(!ruleAst.fragment){
					console.log(ruleAst.name);
					this.lexRules.push(ruleAst);
				}
			}
		}, this);
		
		this.genLexerStateMachine();
	},
	
	genLexerStateMachine:function(){
		this.lexRules.forEach(function(rule){
			buildLexerASTState(rule.alts, this.lexStartState);
		}, this);
	},
	
	buildState:function(){
		return { transition:[] };
	},
	
	/**
	transition's properties:
	{
		type - 'la', 
		v - the char
		state - the next state
	}
	*/
	buildLexerASTState:function(ast, state){
		if(typeof(ast) === 'string'){
			for(var i=0,l=ast.length; i<l; i++){
				var chr = ast.charAt(i);
				
				if(!state.transitions.some(function(t){
						if(t.type === 'la' && t.v === chr){
							state = t.state;
							return true;
						}
				})){
					var newState = buildState();
					state.transitions.push({type: 'la', v: chr, state: newState});
					state = newState;
				}
			}
			return;
		}
		switch(ast.type){
			case 'range':
				if(!state.transitions.some(function(t){
						if(t.type === 'range' && t.from === ast.from && t.to === ast.to){
							state = t.state;
							return true;
						}else if(t.type === 'range' && RangeUtil.isOverlap(t, ast)){
							
						}
				})){
					var newState = buildState();
					state.transitions.push({type: 'range', from: ast.from, to: ast.to, state: newState});
					state = newState;
				}
			case 'not':
				if(!state.transitions.some(function(t){
						if(t.type === 'not' && t.from === ast.from && t.to === ast.to){
							state = t.state;
							return true;
						}
				})){
			case 'wildChar':
			case 'bnf':
			case 'label':
			case 'alts':
			case 'subRule':
		
		}
	},
	
}

module.exports = compile;
