grammar UniversalDdl ;

/**
 * Parser rules
 */
script : WS* (tableDef WS*)+ WS* EOF ;

columnDef : IDENTIFIER WS+ dataType ;
columnDefList : columnDef WS* (',' WS* columnDef)* ;
tableDef : CREATE WS+ TABLE WS+ IDENTIFIER WS* '(' WS* columnDefList WS* ');' ;
dataType : INT_TYPE | FLOAT_TYPE ;

/**
 * Lexer rules
 */

/*
 * SQL is case insensitive, but some people like to put keywords
 * in uppercase in their script.
 * We handle this by using the following fragments.
 * Note: these fragments come from ANTLR official doc.
 */
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

WS : ' ' | '\t' | ('\r'? '\n' | '\r') ;

/*
INT_EXPR : ('+' | '-')? DIGIT+ ;
FLOAT_EXPR : (INT_EXPR '.' DIGIT+) | (INT_EXPR E INT_EXPR) ;
*/

CREATE : C R E A T E ;
TABLE : T A B L E ;
INDEX : I N D E X ;

INT_TYPE : I N T ;
FLOAT_TYPE : F L O A T ;

IDENTIFIER : LETTER (LETTER | UNDERSCORE | DIGIT)* ;
