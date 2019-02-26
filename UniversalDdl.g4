grammar UniversalDdl ;

/**
 * Parser rules
 */

// FIXME: We can't create an index or alter a table
// if no table has been previously created.
script : ( tableDef | indexDef )+ EOF ;

id : IDENTIFIER ;

identifierList : id ( COMMA id )* ;

uniqueConstraintDef : ( KW_CONSTRAINT ( constraintName=id )? )?
                      KW_UNIQUE
                      LEFT_BRACKET
                      identifierList
                      RIGHT_BRACKET
                      ;

uniqueColumnConstraintDef : ( KW_CONSTRAINT ( constraintName=id )? )? KW_UNIQUE ;

primaryKeyConstraintDef : ( KW_CONSTRAINT ( constraintName=id )? )?
                          KW_PK
                          LEFT_BRACKET
                          identifierList
                          RIGHT_BRACKET
                          ;

primaryKeyColumnConstraintDef : ( KW_CONSTRAINT ( constraintName=id )? )? KW_PK ;

onDeleteAction : KW_ON KW_DELETE ( KW_DELETE | KW_RESTRICT )? ;

foreignKeyConstraintDef : ( KW_CONSTRAINT ( constraintName=id )? )?
                          KW_FK
                          LEFT_BRACKET
                          columns=identifierList
                          RIGHT_BRACKET
                          KW_REF
                          referencedTable=id
                          ( LEFT_BRACKET referencedColumns=identifierList RIGHT_BRACKET )?
                          onDelete=onDeleteAction?
                          ;

foreignKeyColumnConstraintDef : ( KW_CONSTRAINT ( constraintName=id )? )?
                                ( KW_FK )?
                                KW_REF
                                referencedTable=id
                                ( LEFT_BRACKET referencedColumn=id RIGHT_BRACKET )?
                                ;

constraintDef : uniqueConstraintDef     # FullUniqueConstraintDef
              | primaryKeyConstraintDef # FullPrimaryKeyConstraintDef
              | foreignKeyConstraintDef # FullForeignKeyConstraintDef
              ;

columnType : BIGINT
           | DATE
           | DATETIME
           | INT
           | REAL
           | SMALLINT
           | TEXT
           | TIME
           | TIMESTAMP
           | TINYINT
           | CHAR LEFT_BRACKET UINT_LITERAL RIGHT_BRACKET
           | DECIMAL ( LEFT_BRACKET UINT_LITERAL ( COMMA UINT_LITERAL )? RIGHT_BRACKET )?
           | FLOAT ( LEFT_BRACKET UINT_LITERAL RIGHT_BRACKET )?
           | NUMERIC ( LEFT_BRACKET UINT_LITERAL ( COMMA UINT_LITERAL )? RIGHT_BRACKET )?
           | VARCHAR LEFT_BRACKET UINT_LITERAL RIGHT_BRACKET
           ;

defaultSpec : KW_DEFAULT (
                UINT_LITERAL
              | INT_LITERAL
              | FLOAT_LITERAL
              | STRING_LITERAL
              | KW_CURRENT_DATE
              | KW_CURRENT_TIME
              | KW_CURRENT_TS
              )
              ;

columnDetails : (
                  KW_NULL
                | KW_NOT_NULL
                | primaryKeyColumnConstraintDef
                | uniqueColumnConstraintDef
                | defaultSpec
                | foreignKeyColumnConstraintDef
                )+
                ;

columnDef : columnName=id columnType columnDetails? ;

tableItemList : ( columnDef | constraintDef ) ( COMMA ( columnDef | constraintDef ) )* ;

tableDef : KW_CREATE
           KW_TABLE
           tableName=id
           LEFT_BRACKET
           tableItemList
           RIGHT_BRACKET
           SEMICOLON
           ;

indexDef : KW_CREATE
           KW_UNIQUE?
           KW_INDEX
           indexName=id
           KW_ON
           tableName=id
           LEFT_BRACKET columns=identifierList RIGHT_BRACKET
           SEMICOLON
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
 * SQL types
 */
BIGINT : B I G I N T ;
CHAR : C H A R ;
DATE : D A T E ;
DATETIME : D A T E T I M E ;
DECIMAL : D E C I M A L ;
FLOAT : F L O A T ;
INT : I N T (E G E R)? ;
NUMERIC : N U M E R I C ;
REAL : R E A L ;
SMALLINT : S M A L L I N T ;
TEXT : T E X T ;
TIME : T I M E ;
TIMESTAMP : T I M E S T A M P ;
TINYINT : T I N Y I N T ;
VARCHAR : V A R C H A R ;

/*
 * Keywords as fragments
 */
fragment CASCADE : C A S C A D E ;
fragment CONSTRAINT : C O N S T R A I N T ;
fragment CREATE : C R E A T E ;
fragment DEFAULT : D E F A U L T ;
fragment DELETE : D E L E T E ;
fragment FOREIGN : F O R E I G N ;
fragment INDEX : I N D E X ;
fragment KEY : K E Y ;
fragment NOT : N O T ;
fragment NULL : N U L L ;
fragment ON : O N ;
fragment PRIMARY : P R I M A R Y ;
fragment REFERENCES : R E F E R E N C E S ;
fragment RESTRICT : R E S T R I C T ;
fragment TABLE : T A B L E ;
fragment UNIQUE : U N I Q U E ;

/*
 * Brackets
 */
LEFT_BRACKET : '(' ;
RIGHT_BRACKET : ')' ;

/*
 * Semicolon
 */
COMMA : ',' ;
SEMICOLON : ';' ;

/*
 * Literals for SQL values
 */
UINT_LITERAL : DIGIT+ ;
INT_LITERAL : ( '+' | '-' )? DIGIT+ ;

FLOAT_LITERAL : ( '+' | '-' )? DIGIT+ '.' DIGIT+
              | ( '+' | '-' )? DIGIT+ E DIGIT+ ;

STRING_LITERAL : '\'' ( ~'\'' | '\'\'' )* '\'' ;

/*
 * Date and time constants
 * https://github.com/antlr/grammars-v4/blob/master/sqlite/SQLite.g4
 */
KW_CURRENT_DATE : C U R R E N T UNDERSCORE D A T E ;
KW_CURRENT_TIME : C U R R E N T UNDERSCORE T I M E ;
KW_CURRENT_TS : C U R R E N T UNDERSCORE T I M E S T A M P ;

/*
 * Keywords
 */
KW_CASCADE : CASCADE ;
KW_CONSTRAINT : CONSTRAINT ;
KW_CREATE : CREATE ;
KW_DEFAULT : DEFAULT ;
KW_DELETE : DELETE ;
KW_FK : FOREIGN WS+ KEY ;
KW_INDEX : INDEX ;
KW_NOT : NOT ;
KW_NOT_NULL : NOT WS+ NULL ;
KW_NULL : NULL ;
KW_ON : ON ;
KW_PK : PRIMARY WS+ KEY ;
KW_REF : REFERENCES ;
KW_RESTRICT : RESTRICT ;
KW_TABLE : TABLE ;
KW_UNIQUE : UNIQUE ;

IDENTIFIER : LETTER ( LETTER | UNDERSCORE | DIGIT )* ;

/*
 * Whitespace
 */
WS : ( ' ' | '\t' | ( '\r'? '\n' | '\r' ) ) -> skip ;
