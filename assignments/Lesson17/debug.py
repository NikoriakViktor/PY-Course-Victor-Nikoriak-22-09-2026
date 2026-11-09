from collections import Counter
import time
# Приклад, де фунція не працює коректно:
# a = "Anagram"
# b = "nag a ram"
# Очікуваний результат: True
# Отриманий результат: False
# Пояснення: 1) тип set не містить однакових елементів. Тому символ "a" set зберігає
# в одиничному екземплярі. Якщо у комірці a буде слово, наприклад, з двома символами "n",
# а комірка b тільки один такий символ, то функція може повернути True (a="collection", b="lection")
# 2) Пробіли. set зберігає одиничний відступ як символ, хоча в анаграмах слова або фрази не обов'язково
# повинні складатись з однакової кількості слів 3) Регістр. Один і той самий символ може бути записаний
# двічі але у різних регістрах. Функція не враховує такі випадки, тому такі символи зберігає окремо, наче як вони різні
def is_anagram_counter(a, b):
    raw_a = a.lower().replace(" ", "")
    raw_b = b.lower().replace(" ", "")
    
    if len(raw_a) != len(raw_b):
        return False
    
    return Counter(raw_a) == Counter(raw_b)

# Версія sorted бере O(n * log(n)) часу, тому що функції треба сортувати елементи рядка за алфавітом,
# коли counter версія тільки порівнює частоту символів двох рядків, що бере O(n) часу
# тобто counter версія швидша за sorted версію з довгими рядками
def is_anagram_sorted(a, b):
    raw_a = a.lower().replace(" ", "")
    raw_b = b.lower().replace(" ", "")

    if len(raw_a) != len(raw_b):
        return False
    
    return sorted(raw_a) == sorted(raw_b)

# two_sum_broken([3, 1, 4], 6) повертає (0, 0), тому що
# словник seen зберігає у собі значення елементів і їх індекс у nums,
# які функція обходить у другому циклі при пошуку пари, яка
# у сумі дає target. Так як словник seen був сформований раніше, то
# другий цикл бачить елементи у seen, які вона на справді ще не бачила
# тому при при аргументах [3, 1, 4], 6 ми маємо:
# seen = {3: 0, 1: 1, 4: 2}
# 6 - 3 = 3 -> seen[3] = 0
def two_sum_broken(nums, target):
    seen = {}

    for i, x in enumerate(nums):
        seen[i] = x

    for i, x in enumerate(nums):
        if target - x in seen:
            return (i, seen[target - x])
    return None
# Fix
def two_sum_fixed(nums, target):
    seen = {}

    for i, x in enumerate(nums):
        if target - x in seen:
            return (i, seen[target - x])
        else:
            seen[x] = i
    return None

def two_sum_nested(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return (i, j)
    return None

big = list(range(20_000))

t1 = time.perf_counter()
two_sum_fixed(big, -1)
t2 = time.perf_counter()
dt_fixed = t2 - t1

t1 = time.perf_counter()
two_sum_nested(big, -1)
t2 = time.perf_counter()
dt_nested = t2 - t1

print(f"Time performance for two sum nested: {dt_nested}")
print(f"Time performance for two sum fixed: {dt_fixed}")

print(is_anagram_counter("collection", "lection"))
print(is_anagram_sorted("conversation", "voices rant on"))
print(is_anagram_sorted("Listen", "silent"))
print(two_sum_fixed([3, 1, 4], 6))