# print(list(evens)) має вивести список [0, 4, 16, 36, 64]
# print(max(squares))має вивести 16
# print(sum(squares)) виведе 0
# Після запуску код видав помилку TypeError: 'int' object is not iterable при першому принті і далі не пішов

def even_squares(numbers):
    for n in numbers:
        if n % 2 == 0:
            # Bug: функція використовувала return, тому вона видавала 0 і далі не йшла і ламала подальший код. Використавши yeild програма може створювати наступні значення за запитом
            yield n * n

evens = even_squares(range(10))
print(list(evens))

# Bug: змінна squares була генератором, а генератори є одноразовими. Під час виклику max() він вичерпався і sum() дав нуль, тобто пустий генератор
squares = [n * n for n in range(5)]
print(max(squares))
print(sum(squares))

# AI log: Обговорювали різницю між return та yield, а також проблему вичерпання генераторів.