start
	= _ abc:(action _)? rules:(rule _)+
	{
		var r = [];
		rules = rules.map(function(el){
			return el[0];
		});
		return r.concat(rules);
	}
rule
	=
	 rn:ruleName _ '=' _ ruleBody (_ ';' )? 
	{
		//console.log("rule end"+ line + ":" + column);
		return { type: "rule", name: rn, 
			line:line(),
			column: column(),
			start: offset(),
			stop: peg$currPos
			};
		
	}
	
ruleName
	= label:label q:(_ Quote)?
	{
		return q == null ? label: label +"("+ q[1] + ')';
	}
	
ruleBody
	= ruleChoice  ( _ '/' _ ruleChoice)*

ruleChoice
	= ruleMultiItem (_ action)?
	
action
	= "{"  ( action / !'}' .  )*  "}" 
	{
		return "{ ... }";
	}

ruleMultiItem "exp1 exp2 ... expn "
	= 
	ruleItem  (  _ !(ruleName _ '=')  ruleItem )*
	
ruleItem "lable:expression"
	=
	( label _ ':' _)? xyz:expression (_ [*+?])?
	{
		return "";
	}
	
	
expression
	= lit1:literal  {return lit1;}
	/ '!' _ (action / expression)
	/ '&' _  (action / expression)
	/ '$' _ expression
	/ '(' _ ruleBody _ ')'
	/ label
	
	
literal
	= '.'					
	/ '[' s:( 
		!(']' / '\\'). 
		/ '\\' . )+ 
	']'
		{
			return s.join('');
		
		}
	/ Quote
	
Quote "StringLiteral"
	=  '"'  content: ([^"\\] / '\\' .)*   '"'			{ return content.join("");}
	/ "'" content: ([^'\\] / '\\' .)* "'"			{ return content.join("");}
	
label
	= labelC:[a-zA-Z0-9_]+
	{
	return labelC.join('');
	}
	
_ "spaceOrEOL"
  = (WhiteSpace / MultiLineComment / SingleLineComment)*
  {return '';}
  
WhiteSpace "white space"
	= [\n\r\t\v\f \u00A0\uFEFF]  {return '';}
	/ Zs	{return '';}

Zs
	= [\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]

MultiLineComment
  = "/*" (!"*/" .)* "*/"
  
SingleLineComment
  = "//" (!LineTerminator .)*
 
  
LineTerminator
  = [\n\r\u2028\u2029]
  
  
LP
	= '('

RP
	= ')'
