// Generated from /home/hop/th/201x/2019/tomko.team/tests-history/test1/UniversalDdl.g4 by ANTLR 4.7.1
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class UniversalDdlParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.7.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, WS=4, CREATE=5, TABLE=6, INDEX=7, INT_TYPE=8, 
		FLOAT_TYPE=9, IDENTIFIER=10;
	public static final int
		RULE_script = 0, RULE_columnDef = 1, RULE_columnDefList = 2, RULE_tableDef = 3, 
		RULE_dataType = 4;
	public static final String[] ruleNames = {
		"script", "columnDef", "columnDefList", "tableDef", "dataType"
	};

	private static final String[] _LITERAL_NAMES = {
		null, "','", "'('", "');'"
	};
	private static final String[] _SYMBOLIC_NAMES = {
		null, null, null, null, "WS", "CREATE", "TABLE", "INDEX", "INT_TYPE", 
		"FLOAT_TYPE", "IDENTIFIER"
	};
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "UniversalDdl.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public UniversalDdlParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}
	public static class ScriptContext extends ParserRuleContext {
		public TerminalNode EOF() { return getToken(UniversalDdlParser.EOF, 0); }
		public List<TerminalNode> WS() { return getTokens(UniversalDdlParser.WS); }
		public TerminalNode WS(int i) {
			return getToken(UniversalDdlParser.WS, i);
		}
		public List<TableDefContext> tableDef() {
			return getRuleContexts(TableDefContext.class);
		}
		public TableDefContext tableDef(int i) {
			return getRuleContext(TableDefContext.class,i);
		}
		public ScriptContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_script; }
	}

	public final ScriptContext script() throws RecognitionException {
		ScriptContext _localctx = new ScriptContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_script);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(13);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==WS) {
				{
				{
				setState(10);
				match(WS);
				}
				}
				setState(15);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(23); 
			_errHandler.sync(this);
			_la = _input.LA(1);
			do {
				{
				{
				setState(16);
				tableDef();
				setState(20);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,1,_ctx);
				while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
					if ( _alt==1 ) {
						{
						{
						setState(17);
						match(WS);
						}
						} 
					}
					setState(22);
					_errHandler.sync(this);
					_alt = getInterpreter().adaptivePredict(_input,1,_ctx);
				}
				}
				}
				setState(25); 
				_errHandler.sync(this);
				_la = _input.LA(1);
			} while ( _la==CREATE );
			setState(30);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==WS) {
				{
				{
				setState(27);
				match(WS);
				}
				}
				setState(32);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(33);
			match(EOF);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ColumnDefContext extends ParserRuleContext {
		public TerminalNode IDENTIFIER() { return getToken(UniversalDdlParser.IDENTIFIER, 0); }
		public DataTypeContext dataType() {
			return getRuleContext(DataTypeContext.class,0);
		}
		public List<TerminalNode> WS() { return getTokens(UniversalDdlParser.WS); }
		public TerminalNode WS(int i) {
			return getToken(UniversalDdlParser.WS, i);
		}
		public ColumnDefContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_columnDef; }
	}

	public final ColumnDefContext columnDef() throws RecognitionException {
		ColumnDefContext _localctx = new ColumnDefContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_columnDef);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(35);
			match(IDENTIFIER);
			setState(37); 
			_errHandler.sync(this);
			_la = _input.LA(1);
			do {
				{
				{
				setState(36);
				match(WS);
				}
				}
				setState(39); 
				_errHandler.sync(this);
				_la = _input.LA(1);
			} while ( _la==WS );
			setState(41);
			dataType();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ColumnDefListContext extends ParserRuleContext {
		public List<ColumnDefContext> columnDef() {
			return getRuleContexts(ColumnDefContext.class);
		}
		public ColumnDefContext columnDef(int i) {
			return getRuleContext(ColumnDefContext.class,i);
		}
		public List<TerminalNode> WS() { return getTokens(UniversalDdlParser.WS); }
		public TerminalNode WS(int i) {
			return getToken(UniversalDdlParser.WS, i);
		}
		public ColumnDefListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_columnDefList; }
	}

	public final ColumnDefListContext columnDefList() throws RecognitionException {
		ColumnDefListContext _localctx = new ColumnDefListContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_columnDefList);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(43);
			columnDef();
			setState(47);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,5,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(44);
					match(WS);
					}
					} 
				}
				setState(49);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,5,_ctx);
			}
			setState(60);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__0) {
				{
				{
				setState(50);
				match(T__0);
				setState(54);
				_errHandler.sync(this);
				_la = _input.LA(1);
				while (_la==WS) {
					{
					{
					setState(51);
					match(WS);
					}
					}
					setState(56);
					_errHandler.sync(this);
					_la = _input.LA(1);
				}
				setState(57);
				columnDef();
				}
				}
				setState(62);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class TableDefContext extends ParserRuleContext {
		public TerminalNode CREATE() { return getToken(UniversalDdlParser.CREATE, 0); }
		public TerminalNode TABLE() { return getToken(UniversalDdlParser.TABLE, 0); }
		public TerminalNode IDENTIFIER() { return getToken(UniversalDdlParser.IDENTIFIER, 0); }
		public ColumnDefListContext columnDefList() {
			return getRuleContext(ColumnDefListContext.class,0);
		}
		public List<TerminalNode> WS() { return getTokens(UniversalDdlParser.WS); }
		public TerminalNode WS(int i) {
			return getToken(UniversalDdlParser.WS, i);
		}
		public TableDefContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_tableDef; }
	}

	public final TableDefContext tableDef() throws RecognitionException {
		TableDefContext _localctx = new TableDefContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_tableDef);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(63);
			match(CREATE);
			setState(65); 
			_errHandler.sync(this);
			_la = _input.LA(1);
			do {
				{
				{
				setState(64);
				match(WS);
				}
				}
				setState(67); 
				_errHandler.sync(this);
				_la = _input.LA(1);
			} while ( _la==WS );
			setState(69);
			match(TABLE);
			setState(71); 
			_errHandler.sync(this);
			_la = _input.LA(1);
			do {
				{
				{
				setState(70);
				match(WS);
				}
				}
				setState(73); 
				_errHandler.sync(this);
				_la = _input.LA(1);
			} while ( _la==WS );
			setState(75);
			match(IDENTIFIER);
			setState(79);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==WS) {
				{
				{
				setState(76);
				match(WS);
				}
				}
				setState(81);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(82);
			match(T__1);
			setState(86);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==WS) {
				{
				{
				setState(83);
				match(WS);
				}
				}
				setState(88);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(89);
			columnDefList();
			setState(93);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==WS) {
				{
				{
				setState(90);
				match(WS);
				}
				}
				setState(95);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(96);
			match(T__2);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class DataTypeContext extends ParserRuleContext {
		public TerminalNode INT_TYPE() { return getToken(UniversalDdlParser.INT_TYPE, 0); }
		public TerminalNode FLOAT_TYPE() { return getToken(UniversalDdlParser.FLOAT_TYPE, 0); }
		public DataTypeContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_dataType; }
	}

	public final DataTypeContext dataType() throws RecognitionException {
		DataTypeContext _localctx = new DataTypeContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_dataType);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(98);
			_la = _input.LA(1);
			if ( !(_la==INT_TYPE || _la==FLOAT_TYPE) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\3\fg\4\2\t\2\4\3\t"+
		"\3\4\4\t\4\4\5\t\5\4\6\t\6\3\2\7\2\16\n\2\f\2\16\2\21\13\2\3\2\3\2\7\2"+
		"\25\n\2\f\2\16\2\30\13\2\6\2\32\n\2\r\2\16\2\33\3\2\7\2\37\n\2\f\2\16"+
		"\2\"\13\2\3\2\3\2\3\3\3\3\6\3(\n\3\r\3\16\3)\3\3\3\3\3\4\3\4\7\4\60\n"+
		"\4\f\4\16\4\63\13\4\3\4\3\4\7\4\67\n\4\f\4\16\4:\13\4\3\4\7\4=\n\4\f\4"+
		"\16\4@\13\4\3\5\3\5\6\5D\n\5\r\5\16\5E\3\5\3\5\6\5J\n\5\r\5\16\5K\3\5"+
		"\3\5\7\5P\n\5\f\5\16\5S\13\5\3\5\3\5\7\5W\n\5\f\5\16\5Z\13\5\3\5\3\5\7"+
		"\5^\n\5\f\5\16\5a\13\5\3\5\3\5\3\6\3\6\3\6\2\2\7\2\4\6\b\n\2\3\3\2\n\13"+
		"\2n\2\17\3\2\2\2\4%\3\2\2\2\6-\3\2\2\2\bA\3\2\2\2\nd\3\2\2\2\f\16\7\6"+
		"\2\2\r\f\3\2\2\2\16\21\3\2\2\2\17\r\3\2\2\2\17\20\3\2\2\2\20\31\3\2\2"+
		"\2\21\17\3\2\2\2\22\26\5\b\5\2\23\25\7\6\2\2\24\23\3\2\2\2\25\30\3\2\2"+
		"\2\26\24\3\2\2\2\26\27\3\2\2\2\27\32\3\2\2\2\30\26\3\2\2\2\31\22\3\2\2"+
		"\2\32\33\3\2\2\2\33\31\3\2\2\2\33\34\3\2\2\2\34 \3\2\2\2\35\37\7\6\2\2"+
		"\36\35\3\2\2\2\37\"\3\2\2\2 \36\3\2\2\2 !\3\2\2\2!#\3\2\2\2\" \3\2\2\2"+
		"#$\7\2\2\3$\3\3\2\2\2%\'\7\f\2\2&(\7\6\2\2\'&\3\2\2\2()\3\2\2\2)\'\3\2"+
		"\2\2)*\3\2\2\2*+\3\2\2\2+,\5\n\6\2,\5\3\2\2\2-\61\5\4\3\2.\60\7\6\2\2"+
		"/.\3\2\2\2\60\63\3\2\2\2\61/\3\2\2\2\61\62\3\2\2\2\62>\3\2\2\2\63\61\3"+
		"\2\2\2\648\7\3\2\2\65\67\7\6\2\2\66\65\3\2\2\2\67:\3\2\2\28\66\3\2\2\2"+
		"89\3\2\2\29;\3\2\2\2:8\3\2\2\2;=\5\4\3\2<\64\3\2\2\2=@\3\2\2\2><\3\2\2"+
		"\2>?\3\2\2\2?\7\3\2\2\2@>\3\2\2\2AC\7\7\2\2BD\7\6\2\2CB\3\2\2\2DE\3\2"+
		"\2\2EC\3\2\2\2EF\3\2\2\2FG\3\2\2\2GI\7\b\2\2HJ\7\6\2\2IH\3\2\2\2JK\3\2"+
		"\2\2KI\3\2\2\2KL\3\2\2\2LM\3\2\2\2MQ\7\f\2\2NP\7\6\2\2ON\3\2\2\2PS\3\2"+
		"\2\2QO\3\2\2\2QR\3\2\2\2RT\3\2\2\2SQ\3\2\2\2TX\7\4\2\2UW\7\6\2\2VU\3\2"+
		"\2\2WZ\3\2\2\2XV\3\2\2\2XY\3\2\2\2Y[\3\2\2\2ZX\3\2\2\2[_\5\6\4\2\\^\7"+
		"\6\2\2]\\\3\2\2\2^a\3\2\2\2_]\3\2\2\2_`\3\2\2\2`b\3\2\2\2a_\3\2\2\2bc"+
		"\7\5\2\2c\t\3\2\2\2de\t\2\2\2e\13\3\2\2\2\17\17\26\33 )\618>EKQX_";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}