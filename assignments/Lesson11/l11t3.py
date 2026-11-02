def even_squares(numbers):
    for n in numbers:
        if n % 2 == 0:
            #Bug: замість yield було return, що змушувало функцію повертати значення один раз при виконанні умови
            yield n * n


evens = even_squares(range(10))

#виведе [81]
#а вивело помилку "int object is not iterable"
print(list(evens))

#Bug: замість квадратних дужок використовувались круглі.  Тому утворився об'єкт типу generator
squares = [n * n for n in range(5)]
print(max(squares))
print(sum(squares))