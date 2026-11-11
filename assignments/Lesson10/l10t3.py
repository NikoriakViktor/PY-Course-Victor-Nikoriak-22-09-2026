# operation_mapper не є декоратором, тому що декоратор приймає функцію 
# як аргумент і повертає модифіковану функцію, тоді як ця функція приймає 
# рядок оператора і повертає обчислювальну функцію (це фабрика функцій).
def _add(a, b):
    return a + b

def _sub(a, b):
    return a - b

def _div(a, b):
    return a / b

def _mul(a, b):
    return a * b

def _pow(a, b):
    return a ** b

def operation_mapper(operation):
    operations = ["+", "-", "/", "*", "**"]

    if operation not in operations:
        return "Wrong operation. Available operations: +, -, /, *, **"

    if operation == "+":
        return _add
    elif operation == "-":
        return _sub
    elif operation == "/":
        return _div
    elif operation == "*":
        return _mul
    else:
        return _pow

"""
operation_mapper("/")(7, 2)
Очікуваний результат: 3.5
Отриманий результат: 3.5

operation_mapper("**")(2, 10)
Очікуваний результат: 1024
Отриманий результат: 1024
"""
print(operation_mapper("/")(7, 2))
print(operation_mapper("**")(2, 10))