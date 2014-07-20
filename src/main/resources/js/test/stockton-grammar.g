REGEX:  (. | . '-' .)*
	;

SL_COMMENT
options {
    paraphrase="a single line comment";
}
    :   "//"
      { if (parser!=null) {
           parser.startComment(inputState.getLine(),inputState.getColumn()-2); }
        }
        (
            options {  greedy = true;  }:
            // '\uffff' means the EOF character.
            // This will fix the issue GROOVY-766 (infinite loop).
            ~('\n'|'\r'|'\uffff')
        )*
        { if (parser!=null) {
              parser.endComment(0,inputState.getLine(),inputState.getColumn(),new String(text.getBuffer(), _begin, text.length()-_begin));
          }
          if (!whitespaceIncluded)  $setType(Token.SKIP); 
        }
        //This might be significant, so don't swallow it inside the comment:
        //ONE_NL
    ;

AT
options {
    paraphrase="'@'";
}
    :   '@'
    ;

// a couple protected methods to assist in matching floating point numbers
protected
EXPONENT
options {
    paraphrase="an exponent";
}
    :   ('e'|'E') ('+'|'-')? ('0'..'9')+
    ;


protected
FLOAT_SUFFIX
options {
    paraphrase="a float or double suffix";
}
    :   'f'|'F'|'d'|'D'
    ;

protected
BIG_SUFFIX
options {
    paraphrase="a big decimal suffix";
}
    :   'g'|'G'
    ;
