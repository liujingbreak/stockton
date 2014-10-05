var _ = require("./lodash.js");

function PredictionContext(cachedHashCode){
	this.cachedHashCode = cachedHashCode;
}

PredictionContext.fromRuleContext = function(atn, outerContext){
	if(outerContext == null)
		outerContext = 'EMPTY';
	if(outerContext.parent==null || outerContext == 'EMPTY')
		return 'EMPTY';
	var parent = PredictionContext.fromRuleContext(atn, outerContext.parent);
	var state = atn.states[outerContext.invokingState];
	var transition = state.transitions[0];
	return new SingletonPredictionContext(parent, transition.followState.stateNumber);
}
PredictionContext.EMPTY_RETURN_STATE = Number.MAX_VALUE;
PredictionContext.prototype = {
	EMPTY_RETURN_STATE: PredictionContext.EMPTY_RETURN_STATE,

	isEmpty:function(){
		return this == PredictionContext.EMPTY;
	},
	toString:function(){
		return this.cachedHashCode;
	},
	calculateHashCode:function(parent, returnState){
		return JSON.stringify({
			p:parent.toString(),
			r:returnState
		});
	},
	calculateEmptyHashCode:function(){
		return '';
	},
	
	hasEmptyPath:function(){
		return this.getReturnState(this.size() - 1) == this.EMPTY_RETURN_STATE;
	}
};

function SingletonPredictionContext(parent, returnState){
	PredictionContext.call(this, 
		parent != null? this.calculateHashCode(parent, returnState) : this.calculateEmptyHashCode());
	if(returnState == -1) throw new Error('Invalid state number');
	this.parent = parent;
	this.returnState = returnState;
}

SingletonPredictionContext.create = function(parent, returnState){
	if ( returnState == this.EMPTY_RETURN_STATE && parent == null ) {
		// someone can pass in the bits of an array ctx that mean $
		return PredictionContext.EMPTY;
	}
	return new SingletonPredictionContext(parent, returnState);
};

SingletonPredictionContext.prototype = _.create(PredictionContext.prototype, {

	size:function(){
		return 1;
	},
	getReturnState:function(){
		return this.returnState;
	},
	getParent:function(index){
		return this.parent;
	}
});

function EmptyPredictionContext(){
	SingletonPredictionContext.call(this, null, this.EMPTY_RETURN_STATE);
}
EmptyPredictionContext.prototype = _.create(SingletonPredictionContext.prototype,{
		isEmpty:function(){ return true; },
		size:function() {
			return 1;
		},
		getReturnState:function(index){
			this.returnState;
		}
});
PredictionContext.EMPTY = new EmptyPredictionContext();
	
function ATNConfig(state, alt, context, semanticContext){
	if(semanticContext === undefined)
		this.semanticContext = SemanticContext.NONE;
	this.state = state;
	this.alt = alt;
	this.context = context;
	this._key = JSON.stringify({
			s:this.state.stateNumber,
			a:this.alt,
			c:this.context == null? null: this.context.toString(),
			m:this.semanticContext.toString()
	});
}
ATNConfig.prototype.toString = function(){
	return this._key;
}

_DECISION_STATE = {
	basicBlockStart: true, plusBlockStart:true, starBlockStart:true,
	plusLoopback:true, starLoopEntry:true, tokensStart:true
};

function isDecisionState(state){
	return _.has(_DECISION_STATE, state.type);
}

function LexerATNConfig(obj){
	_.extend(this, obj);
	this.passedThroughNonGreedyDecision = this.checkNonGreedyDecision(
		this.checkNonGreedyDecision, this.state);
	this._key = JSON.stringify({
			s:this.state.stateNumber,
			a:this.alt,
			c:this.context == null? null: this.context.toString(),
			m:this.semanticContext.toString(),
			p:this.passedThroughNonGreedyDecision ? 1 : 0,
			l:this.lexerActionExecutor? this.lexerActionExecutor.toString() : null
	});
}
LexerATNConfig.prototype = _.create(ATNConfig.prototype, {
		checkNonGreedyDecision:function(checkNonGreedyDecision, target){
			return checkNonGreedyDecision || isDecisionState(target);
			// we only support nonGreedy
		}
});

var SemanticContext = {};

SemanticContext.Predicate = function(){
	this.ruleIndex = -1;
    this.predIndex = -1;
    this.isCtxDependent = false;
    this._key = JSON.stringify({
    		r:this.ruleIndex,
    		p:this.predIndex,
    		c: this.isCtxDependent? 1: 0
    });
}

SemanticContext.Predicate.prototype = {
	toString:function(){
		return this._key;
	}
};

SemanticContext.NONE = new SemanticContext.Predicate();

function DFAState(configs){
	this.stateNumber = -1;
	this.isAcceptState = false;
	this.prediction = 0;
	//other memebers
	// configs
	// edges
	// requiresFullContext
	// predicates
	// lexerActionExecutor
	this.configs = configs;
}

function ATNConfigSet(){
	this.obj = {};
}

ATNConfigSet.prototype = {
	add:function(o){
		this.obj[o] = true;
	}
};

function ATNSimulator(atn, sharedContextCache){
	this.atn = atn;
	this.sharedContextCache = sharedContextCache;
}

ATNSimulator.ERROR = new DFAState(new ATNConfigSet());
ATNSimulator.ERROR.stateNumber = Number.MAX_VALUE;

ATNSimulator.prototype ={
	/**
	@param input baseLLParser's lex object
	*/
	closure:function(input, config, currentAltReachedAcceptState, speculative){
		if ( debug ) {
			console.log("closure("+config.toString()+")");
		}
		if ( config.state.type == 'ruleStop' ) {
			if(debug)
				console.log("closure at %s rule stop %s\n", config.state.ruleName, config);
			if ( config.context == null || config.context.hasEmptyPath() ) {
				if (config.context == null || config.context.isEmpty()) {
					configs.add(config);
					return true;
				}
				else {
					configs.add(new LexerATNConfig({
						state: config.state,
						alt: config.alt,
						context:PredictionContext.EMPTY,
						semanticContext: config.semanticContext,
						reachesIntoOuterContext: config.reachesIntoOuterContext,
						lexerActionExecutor:config.lexerActionExecutor,
						passedThroughNonGreedyDecision: config.passedThroughNonGreedyDecision
					}));
					currentAltReachedAcceptState = true;
				}
			}
			if ( config.context!=null && !config.context.isEmpty() ) {
				for (var i = 0, l= config.context.size(); i < l; i++) {
					if (config.context.getReturnState(i) != PredictionContext.EMPTY_RETURN_STATE) {
						var newContext = config.context.getParent(i); // "pop" return state
						var returnState = this.atn.states.get(config.context.getReturnState(i));
						var c = new LexerATNConfig({
								state: returnState,
								alt: config.alt,
								context:newContext,
								semanticContext: SemanticContext.NONE,
								passedThroughNonGreedyDecision: false
						});
						currentAltReachedAcceptState = this.closure(input, c, configs, currentAltReachedAcceptState, speculative);
					}
				}
			}

			return currentAltReachedAcceptState;
		}
		// optimization
		if ( !config.state.epsilonOnlyTransitions ) {
			if (!currentAltReachedAcceptState || !config.passedThroughNonGreedyDecision) {
				configs.add(config);
			}
		}

		var p = config.state;
		for (var i=0, l= p.transitions.length; i< l; i++) {
			var t = p.transitions[i];
			var c = this.getEpsilonTarget(input, config, t, configs, speculative);
			if ( c!=null ) {
				currentAltReachedAcceptState = this.closure(input, c, configs, currentAltReachedAcceptState, speculative);
			}
		}

		return currentAltReachedAcceptState;
	},
	
	getEpsilonTarget:function(input, config, t, configs, speculative){
		c = null;
		switch (t.type) {
		case 'rule':
			
		}
	}
};


function LexerATNSimulator(){
	
}

LexerATNSimulator.prototype = _.create(ATNSimulator.prototype, {
	execATN: function(lex){
		
	}
});

function DFA(json){
	_.extend(this, json);
	this.states = {};
}

function generateLexer(atn){
	var decisionToDFA = [], i = 0;
	atn.decisionToState.forEach(function(s){
		decisionToDFA.push(new DFA({atnStartState: s, decision: i}));
	});
}

module.exports = {
	ATNConfig: ATNConfig,
	PredictionContext: PredictionContext,
	SingletonPredictionContext: SingletonPredictionContext,
	EmptyPredictionContext: EmptyPredictionContext,
	generateLexer:generateLexer
};
