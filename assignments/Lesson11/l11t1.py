def with_index(iterable, start=0):
    i = 0
    while i < len(iterable):
        yield start, iterable[i]
        start += 1
        i += 1

l = ["banana", "apple", "peach", "pineapple"]

#виведе об'єкт генератора
print(with_index("abc", 1))
#[(1, 'a'), (2, 'b'), (3, 'c')]
print(list(with_index("abc", 1)))
#11 строка проходить yield у функції with_index і одразу повертає ітеруємий об'єкт
#13 строка ітерує через функцію list() об'єкт