# AI log: запитав чому при перетворенні list(numbers) в змінній total, отримував помилку, через те що генератор був вичерпаний після першої операції.

from functools import reduce

prices = ["120", "80", "45", "300"]

# Bug: перетворюємо генератор в лист
numbers = list(map(int, prices))

cheap = filter(lambda p: p < 100, numbers)
print("Cheap:", list(cheap))
# повинно вивестись - [80, 45], вивелось - [80, 45]

# Bug: map() створює лінивий ітератор, який вичерпується після першого використання (у filter),
# тому треба огорнути його в list() при створенні змінної numbers, щоб зберегти значення для наступних викликів.
total = reduce(lambda acc, p: acc + p, numbers)
print("Total:", total)
# повинно вивестись - 545, а вивелась помилка (TypeError: reduce() of empty iterable with no initial value)

# Bug: баг в тому, що нам потрібно передати сам об'єкт функції len, а ми її викликаємо (len()).
names = sorted(["Olena", "Ira", "Bohdan"], key=len)
print(names)
# повинно вивестись - ["Bohdan", "Ira", "Olena"], а вивелась помилка (len() takes exactly one argument (0 given))
