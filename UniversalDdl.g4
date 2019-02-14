grammar UniversalDdl ;

/**
 * Parser rules
 */
script : tableDef+ EOF ;

identifierList : IDENTIFIER ( COMMA IDENTIFIER )* ;

uniqueConstraintDef : KW_CONSTRAINT KW_UNIQUE LEFT_BRACKET identifierList RIGHT_BRACKET ;
pkConstraintDef : KW_CONSTRAINT KW_PK LEFT_BRACKET identifierList RIGHT_BRACKET ;
fkConstraintDef : KW_CONSTRAINT KW_FK LEFT_BRACKET identifierList RIGHT_BRACKET
                  KW_REF IDENTIFIER ( LEFT_BRACKET identifierList RIGHT_BRACKET )? ;

colForeignKeyDef : KW_FK KW_REF IDENTIFIER ( LEFT_BRACKET IDENTIFIER RIGHT_BRACKET )? ;

defaultSpec : KW_DEFAULT (
                INT_LITERAL 
              | FLOAT_LITERAL
              | DATE_LITERAL
              | TIME_LITERAL
              | DATETIME_LITERAL
              | STRING_LITERAL
              | KW_CURRENT_DATE
              | KW_CURRENT_TIME
              | KW_CURRENT_TS
              ) ;

colDetails : ( KW_PK | KW_UNIQUE | KW_NULL | KW_NOT_NULL | defaultSpec | colForeignKeyDef )+ ;
columnDef : IDENTIFIER COL_TYPE colDetails? ;
columnDefList : columnDef ( COMMA columnDef )* ;
tableDef : KW_CREATE KW_TABLE IDENTIFIER LEFT_BRACKET columnDefList RIGHT_BRACKET SEMICOLON ;


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
 * SQL types defined as fragments
 */
fragment TINYINT : T I N Y I N T ;
fragment SMALLINT : S M A L L I N T ;
fragment INT : I N T (E G E R)? ;
fragment BIGINT : B I G I N T ;
fragment DECIMAL : D E C I M A L ;
fragment NUMERIC : N U M E R I C ;
fragment FLOAT : F L O A T ;
fragment REAL : R E A L ;
fragment DATE : D A T E ;
fragment TIME : T I M E ;
fragment DATETIME : D A T E T I M E ;
fragment TIMESTAMP : T I M E S T A M P ;
fragment CHAR : C H A R ;
fragment VARCHAR : V A R C H A R ;
fragment TEXT : T E X T ;

/*
 * Keywords as fragments
 */
fragment CONSTRAINT : C O N S T R A I N T ;
fragment CREATE : C R E A T E ;
fragment DEFAULT : D E F A U L T ;
fragment FOREIGN : F O R E I G N ;
fragment INDEX : I N D E X ;
fragment KEY : K E Y ;
fragment NOT : N O T ;
fragment NULL : N U L L ;
fragment PRIMARY : P R I M A R Y ;
fragment REFERENCES : R E F E R E N C E S ;
fragment TABLE : T A B L E ;
fragment UNIQUE : U N I Q U E ;

/*
 * Brackets
 */
LEFT_BRACKET  : '(' ;
RIGHT_BRACKET : ')' ;

/*
 * Semicolon
 */
COMMA : ',' ;
SEMICOLON : ';' ;

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
 * Date and time constants
 * https://github.com/antlr/grammars-v4/blob/master/sqlite/SQLite.g4
 */
KW_CURRENT_DATE : C U R R E N T UNDERSCORE D A T E ;
KW_CURRENT_TIME : C U R R E N T UNDERSCORE T I M E ;
KW_CURRENT_TS   : C U R R E N T UNDERSCORE T I M E S T A M P ;

/*
 * Keywords
 */
KW_CONSTRAINT : CONSTRAINT ;
KW_CREATE : CREATE ;
KW_DEFAULT : DEFAULT ;
KW_FK : FOREIGN WS+ KEY ;
KW_INDEX : INDEX ;
KW_NOT : NOT ;
KW_NOT_NULL : NOT WS+ NULL ;
KW_NULL : NULL ;
KW_PK : PRIMARY WS+ KEY ;
KW_REF : REFERENCES ;
KW_TABLE : TABLE ;
KW_UNIQUE : UNIQUE ;

COL_TYPE : TINYINT
         | SMALLINT
         | INT
         | BIGINT
         | DECIMAL ( LEFT_BRACKET DIGIT+ ( COMMA DIGIT+ )? RIGHT_BRACKET )?
         | NUMERIC ( LEFT_BRACKET DIGIT+ ( COMMA DIGIT+ )? RIGHT_BRACKET )?
         | FLOAT   ( LEFT_BRACKET DIGIT+ RIGHT_BRACKET  )?
         | REAL
         | DATE
         | TIME
         | DATETIME
         | TIMESTAMP
         | CHAR LEFT_BRACKET WS* INT_LITERAL WS* RIGHT_BRACKET
         | VARCHAR LEFT_BRACKET WS* INT_LITERAL WS* RIGHT_BRACKET
         | TEXT
         ;

IDENTIFIER : LETTER ( LETTER | UNDERSCORE | DIGIT )* ;

/*
 * Whitespace
 */
WS : ( ' ' | '\t' | ( '\r'? '\n' | '\r' ) ) -> skip ;
