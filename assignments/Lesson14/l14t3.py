from functools import wraps


def string_arg_rules(max_length=1, contains=(), exclude=()):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if args:
                for arg in args:
                    if not isinstance(arg, str):
                        raise TypeError("Arguments must have string type!")
                    elif len(arg) > max_length:
                        raise ValueError("Max length of an argument has been exceeded!")
                    if len(contains) != 0:
                        for word in contains:
                            if not word in arg:
                                raise ValueError(f"Arguments must contain '{word}'!")
                    if len(exclude) != 0:
                        for word in exclude:
                            if word in arg:
                                raise ValueError(f"Arguments must not contain '{word}'!")
                        
            return func(*args)
        return wrapper
    return decorator


@string_arg_rules(max_length=15, contains=('05', '@'), exclude=("S", 's'))
def create_slogan(name: str) -> str:
    return f"{name} drinks pepsi in his brand new BMW!"

@string_arg_rules(max_length=10, contains=('@'), exclude=("!", '?'))
def create_numbers(first: int, second: int):
    return f"First number is {first} and second is {second}"

@string_arg_rules(max_length=10, contains=(), exclude=("!", '?'))
def create_sentence(word_one, word_two, word_three):
    return f"Here is {word_one} in a {word_two} full of {word_three}"

if __name__ == "__main__":
    #create_slogan('peter@05')  # ok
    #create_slogan('peter@06')  # ValueError: Arguments must contain '05'
    #create_slogan('Seter@05')  # ValueError: Arguments must not contain 'S'
    #create_numbers(1, 2) # TypeError: Name must have string type!
    print(create_sentence("me", "world", "trials")) # Here is me in a world full of trials
