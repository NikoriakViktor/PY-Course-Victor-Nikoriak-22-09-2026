# Task 1

# AI log: not used

def with_index(iterable,start=0):
    for it in iterable:
        yield (start,it)
        start += 1



print(with_index("abc", 1))
print(list(with_index("abc", 1)))


# При вызоове первого мы получаем текстовое представление обьяекта, а при вызове второго лист запускает перебор генератора
# и собирает получаные елементы в список