grammar Universal_DDL ;

/**
 * Lexer rules
 */

/* SQL is case insensitive, but some people like to put keywords */
/* in uppercase in their script. */
/* We handle this by using the following fragments. */
/* Note: these fragments come from ANTLR official doc. */
fragment A : [aA] ;
fragment B : [bB] ;
fragment C : [cC] ;
fragment D : [dD] ;
fragment E : [eE] ;
fragment F : [fF] ;
fragment G : [gG] ;
fragment H : [hH] ;
fragment I : [iI] ;
fragment J : [jJ] ;
fragment K : [kK] ;
fragment L : [lL] ;
fragment M : [mM] ;
fragment N : [nN] ;
fragment O : [oO] ;
fragment P : [pP] ;
fragment Q : [qQ] ;
fragment R : [rR] ;
fragment S : [sS] ;
fragment T : [tT] ;
fragment U : [uU] ;
fragment V : [vV] ;
fragment W : [wW] ;
fragment X : [xX] ;
fragment Y : [yY] ;
fragment Z : [zZ] ;

fragment DIGIT : [0-9] ;
fragment LETTER : [a-zA-Z] ;
fragment UNDERSCORE : '_' ;

IDENTIFIER : LETTER (LETTER | UNDERSCORE | DIGIT)* ;

INT_EXPR : ('+' | '-')? DIGIT+ ;
FLOAT_EXPR : (INT_EXPR '.' DIGIT+) | (INT_EXPR E INT_EXPR) ;

INT_TYPE : I N T ;
FLOAT_TYPE : F L O A T ;
DATA_TYPE : INT_TYPE | FLOAT_TYPE ;

COL_DEF : IDENTIFIER DATA_TYPE ;
