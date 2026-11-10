# AI log: запитав, чому немає атрибута __code__ для функції len.

def inspector(func):
    functions = {
        'func_name': func.__name__,
        'func_doc_string': func.__doc__,
        'num_of_local_variables': func.__code__.co_nlocals,
        'local_variable_names': func.__code__.co_varnames
    }

    return (f"Func name: {functions['func_name']}\n"
            f"Func docs: {functions['func_doc_string']}\n"
            f"Num of local variables: {functions['num_of_local_variables']}\n"
            f"Name of local variables: {functions['local_variable_names']}\n")


def make_order(item, qty=1):
    """This function return total"""
    price = 100
    total = price * qty
    return f"{qty} x {item}: {total}"


print(inspector(make_order))
print(inspector(inspector))

try:
    inspector(len)

except AttributeError as e:
    print(e)

# рядок виклику num_of_local_variables дає помилку, len немає атрибута __code__, бо це функція Python
# AttributeError: 'builtin_function_or_method' object has no attribute '__code__'. Did you mean: '__call__'?
