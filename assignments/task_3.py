# Task 3

# AI log: not used


def even_squares(numbers):
    for n in numbers:
        if n % 2 == 0:
            #Bug return -> yield
            yield n * n



evens = even_squares(range(10))
print(list(evens))

squares = (n * n for n in range(5))
print(max(squares))
print(sum((n * n for n in range(5)))) #Bug max перебирал уже все значения и не отсавлял sum что перебирать, потому в sum мы генерируем новый список елементов