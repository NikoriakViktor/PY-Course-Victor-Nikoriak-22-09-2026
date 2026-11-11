def arg_rules(type_: type, max_length: int, contains: list):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if args:
                arg = args[0]
                if not isinstance(arg, type_):
                    print("The type of argument passed is not string!")
                    return False
                elif len(arg) > max_length:
                    print(f"The length of the argument string is greater than {max_length}!")
                    return False
                elif len(contains) != 0:
                    for word in contains:
                        if not word in arg:
                            print(f"The argument passed contains {word}!")
                            return False

                return func(arg)
        return wrapper
    return decorator




@arg_rules(type_=str, max_length=15, contains=['05', '@'])
def create_slogan(name: str) -> str:
    return f"{name} drinks pepsi in his brand new BMW!"

print(create_slogan(12345))