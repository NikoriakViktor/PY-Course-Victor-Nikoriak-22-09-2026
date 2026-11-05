def total_of(numbers):
    total = 0
    for n in numbers:
        try:
            total += n
        except NameError as e:
            print(f"NameError: variable '{e.name}' does not exist!")
        except TypeError:
            print(f"TypeError: arguments must be int type")
    return total

# функція повертає 0, тому що у рядку total += number
# number - змінна яка раніше не оголошувалась
# замість number пишемо n і тоді повертаємий результат буде правильний - 6

# обране виключення TypeError
# вибір обумовлений тим, що суть функції - сумувати числа
# якщо один з доданків не буде числом - додавання неможливе
print(total_of([1, 2, 3]))