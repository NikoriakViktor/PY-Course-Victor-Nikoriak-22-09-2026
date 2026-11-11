from functools import wraps

def string_arg_rules(max_length=1, contains=(), exclude=()):
    def decorator(func):
        @wraps(func)
        def wrapper(*args):
            for arg in args:
                if not isinstance(arg, str):
                    raise TypeError("Argument must be a string")
                elif len(arg) > max_length:
                    raise ValueError("Argument length must be less than max_length")
                for n in contains:
                    if n not in arg:
                        raise ValueError(f"Arguments must contain {n}")
                for g in exclude:
                    if g in arg:
                        raise ValueError(f"Arguments must not contain {g}")
            return func(*args)
        return wrapper
    return decorator

@string_arg_rules(max_length=15, contains=('05', '@'), exclude=("S", 's'))
def create_slogan(name: str) -> str:
    return f"{name} drinks pepsi in his brand new BMW!"

print(create_slogan('@Artem05'))

# AI log: Трохи намудрив з циклом для перевірки входження значення символу строки в кортежі contains та exclude. AI вказав на те над чим слід замислитись в логіці, я це виправив (просто прибрав зайві строки) і код запрацював коректно. Весь код написав сам

