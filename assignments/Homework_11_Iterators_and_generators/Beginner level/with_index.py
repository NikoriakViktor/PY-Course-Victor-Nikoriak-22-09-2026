def with_index(iterable, start=0):
    for item in iterable:
        yield start, item
        start += 1

# AI log: None
# Прогноз 1: команда print(with_index("abc", 1)) виведе те, що об'єкт є генератором
# Прогноз 2: print(list(with_index("abc", 1))) виведе список кортежів (індекс, символ)
# Виводи відрізняються, тому що перший виклик лише створює «лінивий» об'єкт генератора, а функція list() примусово запускає його і збирає всі значення до кінця.
