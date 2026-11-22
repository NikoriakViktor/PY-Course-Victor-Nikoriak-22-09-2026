def binary_search_broken(items, target):
    low = 0
    high = len(items) - 1
    # Раніше ця строка не давала можливості зрівнювати одне число із самим собою, а тепер дає і ми маємо можливість знаходити потрібне значення
    while low <= high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            # додав mid - 1 та mid + 1, бо без одиниць значення лівої та правої межі не змінювались і у функції не було сенсу
            low = mid + 1
        else:
            high = mid - 1
    return -1

# При запуску скрипта з ціллю 7 ми попадаємо в нескінчений цикл

def pair_sum_sorted(items, target):
    low = 0
    high = len(items) - 1
    while low < high:
        total = items[low] + items[high]
        if total == target:
            return low, high
        elif total < target:
            low += 1
        else:
            high -= 1
    return None

items_1 = [2, 7, 11, 15, 19, 26]
for num in [26, 9, 100]:
    print(pair_sum_sorted(items_1, num))

# AI log: Gemini. Обговорювали логіку пошуку з двома вказівниками