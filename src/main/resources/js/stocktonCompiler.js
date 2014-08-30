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
	this.preventEpsilonOptionalBlocks = [];
	this.preventEpsilonClosureBlocks = [];
	this.atn = {
		states : [],
		decisionToState:[],
		defineDecisionState:function(s){
			this.decisionToState.push(s);
			return this.decisionToState.length -1;
		},
		addState:function(state){
			if (state != null) {
				state.atn = this;
				state.stateNumber = states.length;
			}
			this.states.push(state);
		},
		removeState:function(state){
			this.states[state.stateNumber] = null;
		}
	};
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
		optimizeSets(this.atn);//todo
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
	@param type: basic, ruleStart, basicBlockStart, blockEnd, starLoopback. plusLoopback
	*/
	newState:function(type){
		var n = new ATNState(type);
		n.ruleName = this.currentRuleName;
		this.atn.addState(n);
		return n;
	},
	/* newTransition:funciton(type, targetState){
		return { type: type, target: targetState };
	} */
	EPSILON_TYPES: {
		epsilon: true, range: false, rule: true, predicate: true, action: true,
		precedence: true, wildcard:false, notSet: false, set: false, atom: false
	},
	
	_isEpsilon: function(transition){
		var yes = this.EPSILON_TYPES[transition.type];
		if(yes === undefined){
			throw new Error('undefined transition type: '+ transition.type);
		}
		return this.EPSILON_TYPES[transition.type];
	},
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
				left.addTransition({type:'range', target: right, from: ast.from, to: ast.to});
				return {left:left, right:right};
			case 'not':
				var setAST = ast.child[0];
				var alts = setAST.child;
				//for lexer only, parser is different
				return this._lexerSet(setAST, alts, true);
			case 'wildcard':
				var left = this.newState('basic', ast);
				var right = this.newState('basic', ast);
				left.addTransition({type:'wildcard', target:right});
				return {left:left, right:right};
			case 'alts':
				var alts = this.buildLexerATN_child(ast, state);
				if ( alts.length == 1 ) {
					return alts[0];
				}
				var start = this.newState('basicBlockStart', ast);
				if(alts.length > 1)
					this.atn.defineDecisionState(start);
				return this._makeBlock(start, ast, alts);
				
			case '*':
				var alts = this.buildLexerATN_child(ast.child[0], state);
				var star = this.newState('starBlockStart', ast);
				if ( alts.length >1 ) this.atn.defineDecisionState(star);
				var h = this._makeBlock(star, ast.child[0], alts);
				return this._star(ast, h);
				
			case '+':
				var alts = this.buildLexerATN_child(ast.child[0], state);
				var plus = this.newState('plusBlockStart', ast);
				if ( alts.length >1 ) this.atn.defineDecisionState(star);
				var h = this._makeBlock(plus, ast.child[0], alts);
				return this._plus(ast, h);
				
			case '?':
				var alts = this.buildLexerATN_child(ast.child[0], state);
				var start = this.newState('basicBlockStart', ast.child[0]);
				this.atn.defineDecisionState(start);
				var h = this._makeBlock(start, ast.child[0], alts);
				return this._optional(ast, h);
				
			case 'label':
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
					var call = {type:'rule', ruleName:ast.name, target: start, followState: right};
					left.addTransition(call);
					return {left:left, right: right};
				}
		}
	},
	buildLexerATN_child:function(ast, state){
		var ch = ast.child;
		var list = new Array(ch.length);
		for(var i=0,l=ch.length; i<l; i++){
			list[i] = this.buildLexerATN(ch[i], state);
		}
		return list;
	},
	_makeBlock:function(start, altsAST, alts){
		var end = this.newState('blockEnd', ast);
		start.endState = end;
		alts.forEach(function(alt){
				start.addTransition({type:'epsilon', target: alt.left});
				alt.right.addTransition({type:'epsilon', target: end});
				var opt = new TailEpsilonRemover(this.atn);
				opt.visit(alt.left);
		}, this);
		
		return {left: start, right: end};
	},
	/**
	 * From {@code (A)?} build either:
	 *
	 * <pre>
	 *  o--A->o
	 *  |     ^
	 *  o---->|
	 * </pre>
	 *
	 * or, if {@code A} is a block, just add an empty alt to the end of the
	 * block
	 */
	_optional:function(optAST, blk){
		var blkStart = blk.left;
		var blkEnd = blk.right;
		this.preventEpsilonOptionalBlocks.push({a: this.currentRuleName, b: blkStart, c: blkEnd});
		var greedy = true;
		//var greedy = ((QuantifierAST)optAST).isGreedy();
		blkStart.nonGreedy = !greedy;
		if ( blkStart!=null ) {
			var eps = {type: 'epsilon', target: blk.right};
			if(!greedy)
				blkStart.addTransition(0, eps);
			else
				blkStart.addTransition(eps);
		}
		optAST.atnState = blk.left;
		return blk;
	},
	
	/**
	 * From {@code (blk)*} build {@code ( blk+ )?} with *two* decisions, one for
	 * entry and one for choosing alts of {@code blk}.
	 *
	 * <pre>
	 *   |------------------ |
	 *   v             		|
	 *   entry--[o-blk-o]->loop  end
	 *   |                		^
	 *   ------------------------|
	 * </pre>
	 *
	 * Note that the optional bypass must jump outside the loop as
	 * {@code (A|B)*} is not the same thing as {@code (A|B|)+}.
	 	entry-> block -> loop
	 */
	 _star:function(starAST, elem){
		var blkStart = elem.left,
			blkEnd = elem.right;
		this.preventEpsilonClosureBlocks.push({a: this.currentRuleName, b: blkStart, c: blkEnd});
		
		var entry = this.newState('starLoopEntry', starAST);
		//entry.nonGreedy = !((QuantifierAST)starAST).isGreedy();
		entry.nonGreedy = false;
		this.atn.defineDecisionState(entry);
		var end = this.newState('loopEnd', starAST);
		var loop = this.newState('starLoopback', starAST);
		entry.loopBackState = loop;
		end.loopBackState = loop;
		
		var blkAST = startAST.child[0];
		//if ( ((QuantifierAST)starAST).isGreedy() ) {
		if(true /* greedy */){
			if (this.expectNonGreedy(blkAST)) {
				console.error('EXPECTED_NON_GREEDY_WILDCARD_BLOCK: %s',starAST.pos);
			}
			entry.addTransition({type: 'epsilon', target: blkStart});
			entry.addTransition({type: 'epsilon', target: end});
		}else{
			// if not greedy, priority to exit branch; make it first
			entry.addTransition({type: 'epsilon', target: end});
			entry.addTransition({type: 'epsilon', target: blkStart});
		}
		blkEnd.addTransition({type: 'epsilon', target: loop});
		loop.addTransition({type: 'epsilon', target: entry});
		starAST.atnState = entry;	// decision is to enter/exit; blk is its own decision
		return {left: entry, right: end};
	 },
	 
	 /**
	 * From {@code (blk)+} build
	 *
	 * <pre>
	 *   |---------|
	 *   v         |
	 *  [o-blk-o]->o->o
	 * </pre>
	 *
	 * We add a decision for loop back node to the existing one at {@code blk}
	 * start.
	 */
	 _plus:function (plusAST, blk) {
		var blkStart = blk.left;
		var blkEnd = blk.right;
		this.preventEpsilonClosureBlocks.push({a:this.currentRuleName, b: blkStart, c: blkEnd});

		var loop = this.newState('plusLoopback', plusAST);
		//loop.nonGreedy = !((QuantifierAST)plusAST).isGreedy();
		loop.nonGreedy = false;
		this.atn.defineDecisionState(loop);
		var end = this.newState('loopEnd', plusAST);
		blkStart.loopBackState = loop;
		end.loopBackState = loop;

		plusAST.atnState = blkStart;
		blkEnd.addTransition({type: 'epsilon', target: loop});		// blk can see loop back

		var blkAST = plusAST.child[0];
		if ( true /* greedy */) {
			if (this.expectNonGreedy(blkAST)) {
				console.error('EXPECTED_NON_GREEDY_WILDCARD_BLOCK: %s', plusAST.pos);
			}
			loop.addTransition({type: 'epsilon', target: blkStart});
			loop.addTransition({type: 'epsilon', target: end});
		}
		else {
			loop.addTransition({type: 'epsilon', target: end});
			loop.addTransition({type: 'epsilon', target: blkStart});
		}

		return {left: blkStart, right: end};
	},
	 
	
	_lexerSet:function(associatedAST, alts, invert){
		var left = this.newState('basic', associatedAST);
		var right = this.newState('basic', associatedAST);
		//todo
	},
	
	 expectNonGreedy:function(blkAST){
	 	if ( this.blockHasWildcardAlt(blkAST) ) {
			return true;
		}

		return false;
	 },
	 
	 blockHasWildcardAlt:function(block){
	 	 var ret = block.child.some(function(alt){
	 	 		 if(alt.type != 'alt') return false;
	 	 		 if(alt.child.length == 1){
	 	 		 	 var e = alt.child[0];
	 	 		 	 if(e.type === 'wildcard')
	 	 		 	 	 return true;
	 	 		 }
	 	 		 return false;
	 	 });
	 	 return ret;
	 }
}
function ATNState(type){
	this.type = type;
	this.transitions = [];
	this.epsilonOnlyTransitions = false;
	this.stateNumber = -1;
}
ATNState.prototype = {
	addTransition:function(index, t){
		if(t === undefined){
			t = index;
			index = null;
		}
		if(this.transitions.length == 0)
			this.epsilonOnlyTransitions = (t.type == 'epsilon');
		else if(this.epsilonOnlyTransitions != (t.type == 'epsilon')){
			this.epsilonOnlyTransitions = false;
			console.log('ATN state %s has both epsilon and non-epsilon transitions.', this.type);
		}
		if(index === null)
			this.transitions.push(t);
		else
			this.transitions.splice(index, 0, t);
	}
};

var ATNVisitor = {
	visit:function(s){
		this.visit_(s, {});
	},
	visit_:function(s, visited){
		if(visited.hasOwnProperty(s.stateNumber))
			return;
		visited[s.stateNumber] = true;
		this.visitState(s);
		s.transitions.forEach(function(t){
				this.visit_(t.target, visited);
		}, this);
	}
};

function TailEpsilonRemover(atn){
	this._atn = atn;
}
_.extend(TailEpsilonRemover.prototype, ATNVisitor, {
	visitState:function(p){
		if(p.type == 'basic' && p.transitions.length === 1){
			var 	q = p.transitions[0].target;
			if(p.transitions[0].type === 'rule'){
				q = p.transitions[0].followState;
			}
			if(q.type === 'basic'){
				// we have p-x->q for x in {rule, action, pred, token, ...}
				// if edge out of q is single epsilon to block end
				// we can strip epsilon p-x->q-eps->r
				var trans = q.transitions[0];
				if(q.transitions.length == 1 && this._isEpsilon(trans) && ! trans.type == 'action'){
					var r = trans.target;
					if (r.type == 'blockEnd' || r.type == 'plusLoopBack' ||
						r.type == "starLoopback")
					{
						if(p.transitions[0].type == 'rule')
							p.transitions[0].followState = r;
						else
							p.transitions[0].target = r;
						this._atn.removeState(q);
					}
				}
			}
		}
	}
});


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
