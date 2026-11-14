# Task 4

# AI log: not used

import sys

# Список удобнее тогда когда нужно несколько раз обращатся к одним и тем не же элементам
# + и когда нужно их хранить для доступа
def squares(n):
    result = []
    for number in range(n):
        result.append(number ** 2)
    return result


# Генератор же полезен когда нам нужно постепенно обрабатывать данные,
# то есть при вызове обычной функции создания списка он создаст полный список и поместит его в памяти
# а если вызвать генератор с теми же параметрами то он будет их выдавать в таком количестве в котором
# мы запросим
def squares_gen(n):
    for number in range(n):
        yield number ** 2


col = 0

for i in squares_gen(100):
    print(i)
    col += 1
    if col == 10:
        break


print(sys.getsizeof(squares(1000)))
# 8856
print(sys.getsizeof(squares_gen(1000)))
# 200