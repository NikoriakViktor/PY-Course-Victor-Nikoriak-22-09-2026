def linear_search(items, target):
    comparisons = 0
    for index, item in enumerate(items):
        comparisons += 1
        if item == target:
            return index, comparisons
    return -1, comparisons

def binary_search(items, target):
    left= 0
    right = len(items)-1
    comparisons = 0
    while left <= right:
        mid = (left+right)//2
        comparisons += 1
        if items[mid] == target:
            return mid, comparisons
        elif items[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1, comparisons

numbers = list(range(0, 200, 2))

# Знадобиться кроків:
# Для 198 -> лінійній: 100 | бінарній: 7
# Для 42 -> лінійній: 21 | бінарній: 5
# Для 7 -> лінійній: 100 | бінарній: 7

for number in [198, 42, 7]:
    index_lin, comparisons_lin = linear_search(numbers, number)
    index_bin, comparisons_bin = binary_search(numbers, number)
    print(f"{number} -> linear: index {index_lin}, {comparisons_lin} comparisons | binary: index {index_bin}, {comparisons_bin} comparisons")

# Пояснення помилок у прогнозах:
# 1. Лінійний (для 42): не врахував нуль як перший елемент, тому 22 кроки замість 21.
# 2. Бінарний (для 42): помилково ділив навпіл саме укане число, тому для 42 вийшло 5 кроків

# AI log: Gemini. Обговорювали логіку зміщення границь