grammar UniversalDdl ;

/**
 * Parser rules
 */
script : WS* (tableDef WS*)+ WS* EOF ;

columnDef : IDENTIFIER WS+ dataType ;
columnDefList : columnDef WS* (',' WS* columnDef)* ;
tableDef : CREATE WS+ TABLE WS+ IDENTIFIER WS* '(' WS* columnDefList WS* ');' ;
dataType : B I T
         | T I N Y I N T
         | S M A L L I N T
         | I N T (E G E R)?
         | B I G I N T
         | D E C I M A L
         | N U M E R I C
         | F L O A T
         | R E A L
         | D A T E
         | T I M E
         | D A T E T I M E
         | T I M E S T A M P
         | Y E A R
         | (N)? C H A R '(' WS* INT_LITERAL WS* ')'
         | (N)? V A R C H A R '(' WS* INT_LITERAL WS* ')'
         | (N)? T E X T
         | B I N A R Y
         | V A R B I N A R Y
         | I M A G E
         | C L O B
         | B L O B
         | X M L
         | J S O N
         ;

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

/*
 * Whitespace
 */
WS : ' ' | '\t' | ('\r'? '\n' | '\r') ;

/*
 * Literals for SQL values
 */
BIT_LITERAL : '0' | '1' ;

INT_LITERAL : ( '+' | '-' )? DIGIT+ ;

FLOAT_LITERAL : ( '+' | '-' )? DIGIT+ '.' DIGIT+
              | ( '+' | '-' )? DIGIT+ E DIGIT+ ;

DATE_LITERAL : ;

CREATE : C R E A T E ;
TABLE : T A B L E ;
INDEX : I N D E X ;

NOT_NULL : N O T WS+ N U L L ;
DEFAULT_SPEC : D E F A U L T WS+ () ;

INT_TYPE : I N T ;
FLOAT_TYPE : F L O A T ;

IDENTIFIER : LETTER (LETTER | UNDERSCORE | DIGIT)* ;
