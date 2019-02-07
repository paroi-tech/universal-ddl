// Generated from /home/hop/th/201x/2019/tomko.team/tests-history/test1/UniversalDdl.g4 by ANTLR 4.7.1
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class UniversalDdlLexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.7.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, WS=4, CREATE=5, TABLE=6, INDEX=7, INT_TYPE=8, 
		FLOAT_TYPE=9, IDENTIFIER=10;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	public static final String[] ruleNames = {
		"T__0", "T__1", "T__2", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", 
		"K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", 
		"Y", "Z", "DIGIT", "LETTER", "UNDERSCORE", "WS", "CREATE", "TABLE", "INDEX", 
		"INT_TYPE", "FLOAT_TYPE", "IDENTIFIER"
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


	public UniversalDdlLexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "UniversalDdl.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getChannelNames() { return channelNames; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\2\f\u00c2\b\1\4\2\t"+
		"\2\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4\13"+
		"\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22\t\22"+
		"\4\23\t\23\4\24\t\24\4\25\t\25\4\26\t\26\4\27\t\27\4\30\t\30\4\31\t\31"+
		"\4\32\t\32\4\33\t\33\4\34\t\34\4\35\t\35\4\36\t\36\4\37\t\37\4 \t \4!"+
		"\t!\4\"\t\"\4#\t#\4$\t$\4%\t%\4&\t&\4\'\t\'\4(\t(\3\2\3\2\3\3\3\3\3\4"+
		"\3\4\3\4\3\5\3\5\3\6\3\6\3\7\3\7\3\b\3\b\3\t\3\t\3\n\3\n\3\13\3\13\3\f"+
		"\3\f\3\r\3\r\3\16\3\16\3\17\3\17\3\20\3\20\3\21\3\21\3\22\3\22\3\23\3"+
		"\23\3\24\3\24\3\25\3\25\3\26\3\26\3\27\3\27\3\30\3\30\3\31\3\31\3\32\3"+
		"\32\3\33\3\33\3\34\3\34\3\35\3\35\3\36\3\36\3\37\3\37\3 \3 \3!\3!\3\""+
		"\3\"\5\"\u0095\n\"\3\"\3\"\5\"\u0099\n\"\5\"\u009b\n\"\3#\3#\3#\3#\3#"+
		"\3#\3#\3$\3$\3$\3$\3$\3$\3%\3%\3%\3%\3%\3%\3&\3&\3&\3&\3\'\3\'\3\'\3\'"+
		"\3\'\3\'\3(\3(\3(\3(\7(\u00be\n(\f(\16(\u00c1\13(\2\2)\3\3\5\4\7\5\t\2"+
		"\13\2\r\2\17\2\21\2\23\2\25\2\27\2\31\2\33\2\35\2\37\2!\2#\2%\2\'\2)\2"+
		"+\2-\2/\2\61\2\63\2\65\2\67\29\2;\2=\2?\2A\2C\6E\7G\bI\tK\nM\13O\f\3\2"+
		"\37\4\2CCcc\4\2DDdd\4\2EEee\4\2FFff\4\2GGgg\4\2HHhh\4\2IIii\4\2JJjj\4"+
		"\2KKkk\4\2LLll\4\2MMmm\4\2NNnn\4\2OOoo\4\2PPpp\4\2QQqq\4\2RRrr\4\2SSs"+
		"s\4\2TTtt\4\2UUuu\4\2VVvv\4\2WWww\4\2XXxx\4\2YYyy\4\2ZZzz\4\2[[{{\4\2"+
		"\\\\||\3\2\62;\4\2C\\c|\4\2\13\13\"\"\2\u00aa\2\3\3\2\2\2\2\5\3\2\2\2"+
		"\2\7\3\2\2\2\2C\3\2\2\2\2E\3\2\2\2\2G\3\2\2\2\2I\3\2\2\2\2K\3\2\2\2\2"+
		"M\3\2\2\2\2O\3\2\2\2\3Q\3\2\2\2\5S\3\2\2\2\7U\3\2\2\2\tX\3\2\2\2\13Z\3"+
		"\2\2\2\r\\\3\2\2\2\17^\3\2\2\2\21`\3\2\2\2\23b\3\2\2\2\25d\3\2\2\2\27"+
		"f\3\2\2\2\31h\3\2\2\2\33j\3\2\2\2\35l\3\2\2\2\37n\3\2\2\2!p\3\2\2\2#r"+
		"\3\2\2\2%t\3\2\2\2\'v\3\2\2\2)x\3\2\2\2+z\3\2\2\2-|\3\2\2\2/~\3\2\2\2"+
		"\61\u0080\3\2\2\2\63\u0082\3\2\2\2\65\u0084\3\2\2\2\67\u0086\3\2\2\29"+
		"\u0088\3\2\2\2;\u008a\3\2\2\2=\u008c\3\2\2\2?\u008e\3\2\2\2A\u0090\3\2"+
		"\2\2C\u009a\3\2\2\2E\u009c\3\2\2\2G\u00a3\3\2\2\2I\u00a9\3\2\2\2K\u00af"+
		"\3\2\2\2M\u00b3\3\2\2\2O\u00b9\3\2\2\2QR\7.\2\2R\4\3\2\2\2ST\7*\2\2T\6"+
		"\3\2\2\2UV\7+\2\2VW\7=\2\2W\b\3\2\2\2XY\t\2\2\2Y\n\3\2\2\2Z[\t\3\2\2["+
		"\f\3\2\2\2\\]\t\4\2\2]\16\3\2\2\2^_\t\5\2\2_\20\3\2\2\2`a\t\6\2\2a\22"+
		"\3\2\2\2bc\t\7\2\2c\24\3\2\2\2de\t\b\2\2e\26\3\2\2\2fg\t\t\2\2g\30\3\2"+
		"\2\2hi\t\n\2\2i\32\3\2\2\2jk\t\13\2\2k\34\3\2\2\2lm\t\f\2\2m\36\3\2\2"+
		"\2no\t\r\2\2o \3\2\2\2pq\t\16\2\2q\"\3\2\2\2rs\t\17\2\2s$\3\2\2\2tu\t"+
		"\20\2\2u&\3\2\2\2vw\t\21\2\2w(\3\2\2\2xy\t\22\2\2y*\3\2\2\2z{\t\23\2\2"+
		"{,\3\2\2\2|}\t\24\2\2}.\3\2\2\2~\177\t\25\2\2\177\60\3\2\2\2\u0080\u0081"+
		"\t\26\2\2\u0081\62\3\2\2\2\u0082\u0083\t\27\2\2\u0083\64\3\2\2\2\u0084"+
		"\u0085\t\30\2\2\u0085\66\3\2\2\2\u0086\u0087\t\31\2\2\u00878\3\2\2\2\u0088"+
		"\u0089\t\32\2\2\u0089:\3\2\2\2\u008a\u008b\t\33\2\2\u008b<\3\2\2\2\u008c"+
		"\u008d\t\34\2\2\u008d>\3\2\2\2\u008e\u008f\t\35\2\2\u008f@\3\2\2\2\u0090"+
		"\u0091\7a\2\2\u0091B\3\2\2\2\u0092\u009b\t\36\2\2\u0093\u0095\7\17\2\2"+
		"\u0094\u0093\3\2\2\2\u0094\u0095\3\2\2\2\u0095\u0096\3\2\2\2\u0096\u0099"+
		"\7\f\2\2\u0097\u0099\7\17\2\2\u0098\u0094\3\2\2\2\u0098\u0097\3\2\2\2"+
		"\u0099\u009b\3\2\2\2\u009a\u0092\3\2\2\2\u009a\u0098\3\2\2\2\u009bD\3"+
		"\2\2\2\u009c\u009d\5\r\7\2\u009d\u009e\5+\26\2\u009e\u009f\5\21\t\2\u009f"+
		"\u00a0\5\t\5\2\u00a0\u00a1\5/\30\2\u00a1\u00a2\5\21\t\2\u00a2F\3\2\2\2"+
		"\u00a3\u00a4\5/\30\2\u00a4\u00a5\5\t\5\2\u00a5\u00a6\5\13\6\2\u00a6\u00a7"+
		"\5\37\20\2\u00a7\u00a8\5\21\t\2\u00a8H\3\2\2\2\u00a9\u00aa\5\31\r\2\u00aa"+
		"\u00ab\5#\22\2\u00ab\u00ac\5\17\b\2\u00ac\u00ad\5\21\t\2\u00ad\u00ae\5"+
		"\67\34\2\u00aeJ\3\2\2\2\u00af\u00b0\5\31\r\2\u00b0\u00b1\5#\22\2\u00b1"+
		"\u00b2\5/\30\2\u00b2L\3\2\2\2\u00b3\u00b4\5\23\n\2\u00b4\u00b5\5\37\20"+
		"\2\u00b5\u00b6\5%\23\2\u00b6\u00b7\5\t\5\2\u00b7\u00b8\5/\30\2\u00b8N"+
		"\3\2\2\2\u00b9\u00bf\5? \2\u00ba\u00be\5? \2\u00bb\u00be\5A!\2\u00bc\u00be"+
		"\5=\37\2\u00bd\u00ba\3\2\2\2\u00bd\u00bb\3\2\2\2\u00bd\u00bc\3\2\2\2\u00be"+
		"\u00c1\3\2\2\2\u00bf\u00bd\3\2\2\2\u00bf\u00c0\3\2\2\2\u00c0P\3\2\2\2"+
		"\u00c1\u00bf\3\2\2\2\b\2\u0094\u0098\u009a\u00bd\u00bf\2";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}