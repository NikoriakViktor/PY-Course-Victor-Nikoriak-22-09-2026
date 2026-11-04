def make_operation(operation, *numbers):
    result = numbers[0]

    if operation == "+":
        for i in numbers[1:]:
            result += i
    elif operation == "-":
        for i in numbers[1:]:
            result -= i
    elif operation == "*":
        for i in numbers[1:]:
            result *= i
    else:
        print("Wrong operation!")
        return

    return result

#Функція make_operation("-", 10) виведе 10 у терміналі. Тому що програма починає циклом for віднімати перший елемент від усіх інших по черзі
#так як елемент лише 1, то і цикл не має ітерацій
print(make_operation("-", 10))

#Очікуваний результат функції 3
#Фактичний - 3.0. Тобто функція повернула 3.0 типу float
print(make_operation("*", 2, 0.5, 3))