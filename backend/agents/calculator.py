from simpleeval import simple_eval


def calculate(expression):

    try:

        original_expression = expression

        expression = expression.lower()

        expression = (
            expression
            .replace("calculate", "")
            .replace("what is", "")
            .replace("?", "")
        )

        expression = expression.strip()

        result = simple_eval(expression)

        return {
            "tool": "calculator",
            "expression": original_expression,
            "clean_expression": expression,
            "result": result
        }


    except Exception:

        return {
            "tool": "calculator",
            "error": "I couldn't calculate that expression."
        }