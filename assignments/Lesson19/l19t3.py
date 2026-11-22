def make_order(item, qty=1):
    price = 100
    total = price * qty
    return f"{qty} x {item}: {total}"

def inspector(func):
    '''Inspects a passed function and returns its name, docs, number of local variables and names of local variables'''
    print(
        f"Func name: {func.__name__ if hasattr(func, '__name__') else 'N/A (Built-in)'}\n" +
        f"Func docs: {func.__doc__ if hasattr(func, '__doc__') else 'N/A (Built-in)'}\n"
        f"Num of local variables: {func.__code__.co_nlocals if hasattr(func, '__code__') else 'N/A (Built-in)'}\n" +
        f"Names of local variables: {func.__code__.co_varnames if hasattr(func, '__code__') else 'N/A (Built-in)'}\n"
    )

inspector(inspector)
inspector(make_order)
# У вбудобаної функції len нема атрибуту __code__, тому виконання такого коду виведе помилку
# Останній рядок помилки: AttributeError: 'builtin_function_or_method' object has no attribute '__code__'. Did you mean: '__call__'?
inspector(len)