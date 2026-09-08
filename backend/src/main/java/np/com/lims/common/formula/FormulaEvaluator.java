package np.com.lims.common.formula;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Map;

/**
 * A small, dependency-free arithmetic evaluator for calculated result parameters.
 *
 * <p>Supports {@code + - * / ^}, unary minus, parentheses, numeric literals, named
 * variables (parameter codes plus {@code age}, {@code sexM}, {@code sexF}), the
 * comparison operators {@code < > <= >= ==}, and the functions {@code ln, log10,
 * exp, pow, min, max, abs, round, if}. Comparisons yield {@code 1}/{@code 0} so
 * {@code if(cond, a, b)} works.
 *
 * <p>Any missing variable, division by zero or malformed expression makes
 * {@link #evaluate} return {@code null} — the calculated parameter is simply left blank.
 */
public final class FormulaEvaluator {

    private final String src;
    private final Map<String, BigDecimal> vars;
    private int pos;

    private FormulaEvaluator(String src, Map<String, BigDecimal> vars) {
        this.src = src;
        this.vars = vars;
    }

    public static BigDecimal evaluate(String expression, Map<String, BigDecimal> variables) {
        if (expression == null || expression.isBlank()) {
            return null;
        }
        try {
            FormulaEvaluator e = new FormulaEvaluator(expression, variables);
            double result = e.parseExpression();
            e.skipWs();
            if (e.pos != e.src.length() || Double.isNaN(result) || Double.isInfinite(result)) {
                return null;
            }
            return BigDecimal.valueOf(result).round(new MathContext(12));
        } catch (RuntimeException ex) {
            return null;
        }
    }

    /** Names referenced by an expression, so callers can tell which parameters a formula needs. */
    public static java.util.Set<String> referencedNames(String expression) {
        java.util.Set<String> names = new java.util.LinkedHashSet<>();
        if (expression == null) {
            return names;
        }
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("[A-Za-z_][A-Za-z0-9_]*").matcher(expression);
        java.util.Set<String> fns = java.util.Set.of("ln", "log10", "exp", "pow", "min", "max", "abs", "round", "if");
        while (m.find()) {
            String name = m.group();
            if (!fns.contains(name)) {
                names.add(name);
            }
        }
        return names;
    }

    // expression := comparison
    private double parseExpression() {
        double left = parseAdditive();
        skipWs();
        for (String op : new String[] {"<=", ">=", "==", "<", ">"}) {
            if (src.startsWith(op, pos)) {
                pos += op.length();
                double right = parseAdditive();
                return switch (op) {
                    case "<" -> left < right ? 1 : 0;
                    case ">" -> left > right ? 1 : 0;
                    case "<=" -> left <= right ? 1 : 0;
                    case ">=" -> left >= right ? 1 : 0;
                    default -> left == right ? 1 : 0;
                };
            }
        }
        return left;
    }

    private double parseAdditive() {
        double value = parseMultiplicative();
        while (true) {
            skipWs();
            if (consume('+')) {
                value += parseMultiplicative();
            } else if (consume('-')) {
                value -= parseMultiplicative();
            } else {
                return value;
            }
        }
    }

    private double parseMultiplicative() {
        double value = parsePower();
        while (true) {
            skipWs();
            if (consume('*')) {
                value *= parsePower();
            } else if (consume('/')) {
                double d = parsePower();
                if (d == 0) {
                    throw new ArithmeticException("div by zero");
                }
                value /= d;
            } else {
                return value;
            }
        }
    }

    private double parsePower() {
        double base = parseUnary();
        skipWs();
        if (consume('^')) {
            return Math.pow(base, parseUnary());
        }
        return base;
    }

    private double parseUnary() {
        skipWs();
        if (consume('-')) {
            return -parseUnary();
        }
        if (consume('+')) {
            return parseUnary();
        }
        return parsePrimary();
    }

    private double parsePrimary() {
        skipWs();
        if (consume('(')) {
            double v = parseExpression();
            expect(')');
            return v;
        }
        char c = peek();
        if (Character.isDigit(c) || c == '.') {
            int start = pos;
            while (pos < src.length() && (Character.isDigit(src.charAt(pos)) || src.charAt(pos) == '.')) {
                pos++;
            }
            return Double.parseDouble(src.substring(start, pos));
        }
        if (Character.isLetter(c) || c == '_') {
            int start = pos;
            while (pos < src.length()
                    && (Character.isLetterOrDigit(src.charAt(pos)) || src.charAt(pos) == '_')) {
                pos++;
            }
            String name = src.substring(start, pos);
            skipWs();
            if (peek() == '(') {
                return callFunction(name);
            }
            BigDecimal v = vars.get(name);
            if (v == null) {
                throw new IllegalStateException("unknown variable " + name);
            }
            return v.doubleValue();
        }
        throw new IllegalStateException("unexpected '" + c + "'");
    }

    private double callFunction(String name) {
        expect('(');
        java.util.List<Double> args = new java.util.ArrayList<>();
        skipWs();
        if (peek() != ')') {
            args.add(parseExpression());
            skipWs();
            while (consume(',')) {
                args.add(parseExpression());
                skipWs();
            }
        }
        expect(')');
        return switch (name) {
            case "ln" -> Math.log(args.get(0));
            case "log10" -> Math.log10(args.get(0));
            case "exp" -> Math.exp(args.get(0));
            case "abs" -> Math.abs(args.get(0));
            case "pow" -> Math.pow(args.get(0), args.get(1));
            case "min" -> Math.min(args.get(0), args.get(1));
            case "max" -> Math.max(args.get(0), args.get(1));
            case "round" -> BigDecimal.valueOf(args.get(0))
                    .setScale(args.size() > 1 ? args.get(1).intValue() : 0, RoundingMode.HALF_UP).doubleValue();
            case "if" -> args.get(0) != 0 ? args.get(1) : args.get(2);
            default -> throw new IllegalStateException("unknown function " + name);
        };
    }

    private void skipWs() {
        while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) {
            pos++;
        }
    }

    private char peek() {
        return pos < src.length() ? src.charAt(pos) : '\0';
    }

    private boolean consume(char c) {
        skipWs();
        if (peek() == c) {
            pos++;
            return true;
        }
        return false;
    }

    private void expect(char c) {
        if (!consume(c)) {
            throw new IllegalStateException("expected '" + c + "'");
        }
    }
}
