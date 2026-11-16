import functools

def logger(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        result = f"{func.__name__} called with"
        for arg in args:
            result += f" {arg},"

        for (i, j) in kwargs.items():
            result += f" {i}='{j}',"

        print(result[:(len(result) - 1)])

    return wrapper

@logger
def add(x, y):
    return x + y

@logger
def square_all(*args):
    return [arg ** 2 for arg in args]

@logger
def test_some2(a, b, c):
    return a

#print(add(5, 6)) виведе add called with (5, 6) і None, None тому що wraper має щось повертати,
#так як повертаєме значення не вказане, то функція повертає None
print(add(5, 6))
print(square_all(1, 2, 3, 4, 5))
print(test_some2(2, b='y', c='e'))

#Результат без functools.wraps: wrapper
#Результат з functools.wraps: add
print(add.__name__)