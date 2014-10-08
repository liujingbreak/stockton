var _ = require("lodash");
var debug = true;
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
};

PredictionContext.merge = function(){
	//todo
};

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
	if(obj.config)
		this.initWithConfig(obj.config);
	delete obj.config;
	
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
		initWithConfig: function(config){
			this.alt = config.alt;
			this.semanticContext = config.semanticContext;
			this.reachesIntoOuterContext = config.reachesIntoOuterContext;
			this.lexerActionExecutor = config.lexerActionExecutor;
			this.passedThroughNonGreedyDecision = config.passedThroughNonGreedyDecision;
		},
		
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

function ConfigHashSet(){
	
}


function ATNConfigSet(){
	this.obj = {};
	this.configs = [];
	this.hasSemanticContext = false;
	this.readonly = false;
	this.fullCtx = true;
	this.configLookup = null;
}

ATNConfigSet.prototype = {
	add:function(config, mergeCache){
		if ( this.readonly ) throw new Error("This set is readonly");
		if ( config.semanticContext!=SemanticContext.NONE ) {
			this.hasSemanticContext = true;
		}
		if (config.reachesIntoOuterContext > 0) {
			this.dipsIntoOuterContext = true;
		}
		if(!this.configLookup.hasOwnProperty(config)){
			this.cachedHashCode = -1;
			this.configs.push(config);  // track order here
			return true;
		}
		var existing = this.configLookup[config];
		// a previous (s,i,pi,_), merge with it and save result
		var rootIsWildcard = !this.fullCtx;
		var merged =
			PredictionContext.merge(existing.context, config.context, rootIsWildcard, mergeCache);
		// no need to check for existing.context, config.context in cache
		// since only way to create new graphs is "call rule" and here. We
		// cache at both places.
		existing.reachesIntoOuterContext =
			Math.max(existing.reachesIntoOuterContext, config.reachesIntoOuterContext);
		existing.context = merged; // replace context; no need to alt mapping
		return true;
	}
};

function OrderedATNConfigSet(){
	this.configLookup = {};
}
OrderedATNConfigSet.prototype = _.create(ATNConfigSet.prototype);

function ATNSimulator(atn, sharedContextCache){
	this.atn = atn;
	this.sharedContextCache = sharedContextCache;
}

ATNSimulator.ERROR = new DFAState(new ATNConfigSet());
ATNSimulator.ERROR.stateNumber = Number.MAX_VALUE;

ATNSimulator.prototype ={
	
};


function LexerATNSimulator(){
	this.mode = 0;//todo
	this.decisionToDFA = [];
}

LexerATNSimulator.prototype = _.create(ATNSimulator.prototype, {
	matchATN:function(input){
		var startState = this.atn.states[0];
		if ( debug ) {
			console.log("matchATN mode %d start: %s\n", this.mode, startState);
		}
		var old_mode = mode;
		var s0_closure = this.computeStartState(input, startState);
		var suppressEdge = s0_closure.hasSemanticContext;
		var next = this.addDFAState(s0_closure);
		if (!suppressEdge) {
			this.decisionToDFA[mode].s0 = next;
		}

		var predict = this.execATN(input, next);

		if ( debug ) {
			console.log( "DFA after matchATN: %s\n", this.decisionToDFA[old_mode].toString());
		}

		return predict;
	},
	
	execATN: function(lex){
		//todo
	},
	
	computeStartState:function(input, startState){
		//todo
	},
	
	addDFAState:function(configs){
		if(configs.hasSemanticContext)
			throw new Error('configs.hasSemanticContext can\'t be true in here');
		var proposed = new DFAState(configs);
		var firstConfigWithRuleStopState = null;
		//todo
	},
	/**
	@param input baseLLParser's lex object
	*/
	closure:function(input, config, configs, currentAltReachedAcceptState, speculative){
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
						config: config,
						state: config.state,
						context:PredictionContext.EMPTY
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
				var newContext =
						SingletonPredictionContext.create(config.context, t.followState.stateNumber);
					c = new LexerATNConfig({config: config, state:t.target, context: newContext});
					break;
			case 'precedence':
				throw new Error("Precedence predicates are not supported in lexers.");
			case 'predicate':
				/*  Track traversing semantic predicates. If we traverse,
				 we cannot add a DFA state for this "reach" computation
				 because the DFA would not test the predicate again in the
				 future. Rather than creating collections of semantic predicates
				 like v3 and testing them on prediction, v4 will test them on the
				 fly all the time using the ATN not the DFA. This is slower but
				 semantically it's not used that often. One of the key elements to
				 this predicate mechanism is not adding DFA states that see
				 predicates immediately afterwards in the ATN. For example,

				 a : ID {p1}? | ID {p2}? ;

				 should create the start state for rule 'a' (to save start state
				 competition), but should not create target of ID state. The
				 collection of ATN states the following ID references includes
				 states reached by traversing predicates. Since this is when we
				 test them, we cannot cash the DFA state target of ID.
			 */
			 	var pt = t;
				if ( debug ) {
					console.log("EVAL rule "+pt.ruleName+":"+pt.predIndex);
				}
				configs.hasSemanticContext = true;
				if (this.evaluatePredicate(input, pt.ruleIndex, pt.predContent, speculative)) {
					c = new LexerATNConfig({config: config, state:t.target});
				}
				break;
			case 'action':
				if (config.context == null || config.context.hasEmptyPath()) {
					// execute actions anywhere in the start rule for a token.
					//todo
					var lexerActionExecutor = LexerActionExecutor.append(config.lexerActionExecutor, t.actionContent);
					c = new LexerATNConfig({config: config, state: t.target, lexerActionExecutor:lexerActionExecutor});
					break;
				}else {
					// ignore actions in referenced rules
					c = new LexerATNConfig({config: config, state: t.target});
					break;
				}
			case 'epsilon':
				c = new LexerATNConfig({config: config, state:t.target});
				break;
		}
	},
	
	evaluatePredicate:function(input, ruleName, predContent, speculative){
		//todo
		console.log('evaluatePredicate() --> %s', predContent);
		return true;
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
