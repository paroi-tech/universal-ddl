grammar UniversalDdl ;

/**
 * Parser rules
 */
script : WS* (tableDef WS*)+ WS* EOF ;

identifierList : IDENTIFIER WS* ( ',' WS* IDENTIFIER )* ;

pkConstraintDef : CONSTRAINT WS+ PK WS+ '(' identifierList ')' ;
fkConstraintDef : CONSTRAINT WS+ FK WS+ '(' identifierList ')'
                  REFERENCES IDENTIFIER ( '(' identifierList ')' )? ;

colForeignKeyDef : FK WS+ REFERENCES WS+ IDENTIFIER WS* ( '(' WS* IDENTIFIER WS* ')'  )? ;
colDetails : ( ( PK | UNIQUE | NULL | NOT_NULL | defaultSpec | colForeignKeyDef ) WS+ )+ ;
columnDef : IDENTIFIER WS+ COL_TYPE WS+ colDetails? ;
columnDefList : columnDef WS* (',' WS* columnDef)* ;
tableDef : CREATE WS+ TABLE WS+ IDENTIFIER WS* '(' WS* columnDefList WS* ');' ;
defaultSpec : D E F A U L T WS+ (
                INT_LITERAL 
              | FLOAT_LITERAL
              | DATE_LITERAL
              | TIME_LITERAL
              | DATETIME_LITERAL
              | STRING_LITERAL
              | CURRENT_DATE
              | CURRENT_TIME
              | CURRENT_TS
              ) ;

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

DATE_LITERAL : DIGIT DIGIT DIGIT DIGIT '-' DIGIT DIGIT '-' DIGIT DIGIT ;

TIME_LITERAL : DIGIT DIGIT ':' DIGIT DIGIT ':' DIGIT DIGIT ;

DATETIME_LITERAL : DATE_LITERAL ' ' TIME_LITERAL ;

STRING_LITERAL : '\'' ( ~'\'' | '\'\'' )* '\'' ;

/*
 * Constraint keywords
 */
PK : P R I M A R Y WS+ K E Y ;
FK : F O R E I G N WS+ K E Y ;
REFERENCES : R E F E R E N C E S ;
UNIQUE : U N I Q U E ;
CONSTRAINT : C O N S T R A I N T ;

/*
 * DDL keywords
 */
CREATE : C R E A T E ;
TABLE : T A B L E ;
INDEX : I N D E X ;

NULL : N U L L ;
NOT_NULL : N O T WS+ N U L L ;

COL_TYPE : T I N Y I N T
         | S M A L L I N T
         | I N T (E G E R)?
         | B I G I N T
         | D E C I M A L ( '(' WS* DIGIT+ ( WS* ',' WS* DIGIT+ WS* )? ')' )?
         | N U M E R I C ( '(' WS* DIGIT+ ( WS* ',' WS* DIGIT+ WS* )? ')' )?
         | F L O A T ( '(' WS* DIGIT+ WS* ')' )?
         | R E A L
         | D A T E
         | T I M E
         | D A T E T I M E
         | T I M E S T A M P
         | C H A R '(' WS* INT_LITERAL WS* ')'
         | V A R C H A R '(' WS* INT_LITERAL WS* ')'
         | T E X T
         ;

/*
 * Date and time constants
 * https://github.com/antlr/grammars-v4/blob/master/sqlite/SQLite.g4
 */
CURRENT_DATE : C U R R E N T '_' D A T E ;
CURRENT_TIME : C U R R E N T '_' T I M E ;
CURRENT_TS : C U R R E N T '_' T I M E S T A M P ;

IDENTIFIER : LETTER (LETTER | UNDERSCORE | DIGIT)* ;
