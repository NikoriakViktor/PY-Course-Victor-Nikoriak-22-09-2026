# operation_mapper не є декоратором, тому що декоратор приймає функцію 
# як аргумент і повертає модифіковану функцію, тоді як ця функція приймає 
# рядок оператора і повертає обчислювальну функцію (це фабрика функцій).
def _add(a, b):
    return a + b

def _sub(a, b):
    return a - b

def _div(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("The division of zero has occured")

def _mul(a, b):
    return a * b

def _pow(a, b):
    return a ** b

def operation_mapper(operation):
    operations = {"+": _add, "-": _sub, "/": _div, "*": _mul, "**": _pow}

    if operation not in operations:
       raise ValueError(f"Unkown operation '{operation}'")

    return operations[operation]

print(operation_mapper("+")(1, 2))   # 3
print(operation_mapper("**")(2, 10)) # 1024
# помилку ділення на ноль має обробляти функція _div
# тому що змінні a і b відносяться до цієї функції, ця функція лише повертає значення у фабрику функцій operation_mapper
print(operation_mapper("/")(1, 0))
print(operation_mapper("10"))         # should not silently fail — see below