# AI log: за допомогою підказок від ментора розібрав різницю Big O для Counter та sorted, виправив логічну помилку самоповторення в two_sum та
# реалізував універсальний секундомір, використовуючи передачу функцій як об'єктів.

# на великій к-ті даних, Counter працює швидше через те що його складність O(n), тобто він зробить таку к-ть кроків скільки буде даних(n),
# а у відсортованій версії потрібно порівнювати елементи між собою, через що к-ть кроків буде зростати в складності O(n logn)

# Чому повертає (0, 0): перший цикл заздалегідь зберігає всі числа в словник,
# тому під час перевірки число 3 знаходить в словнику само себе на індексі 0 (адже 6 - 3 = 3).
# Що робить один прохід: ми перевіряємо різницю до того, як додати поточне число в словник, це унеможливлює використання одного й того ж елемента двічі.

import time
from collections import Counter

t = '-' * 50


def is_anagram_broken(a, b):
    return sorted(a.strip().replace(' ', '').lower()) == sorted(b.strip().replace(' ', '').lower())


def is_anagram_broken_counter(a, b):
    return Counter(a.strip().replace(' ', '').lower()) == Counter(b.strip().replace(' ', '').lower())


def time_check(func, arg1, arg2):
    time_start = time.perf_counter()
    func(arg1, arg2)
    time_end = time.perf_counter()
    time_difference = time_end - time_start
    return f"час виконання ({func.__name__}): {time_difference:.10f}"


def two_sum_broken(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        seen[x] = i
    for i, x in enumerate(nums):
        if target - x in seen:
            return i, seen[target - x]
    return None


def two_sum(nums, target):
    seen = {}

    for i, x in enumerate(nums):

        if target - x in seen:
            return seen[target - x], i

        seen[x] = i

    return None


print(t)

# is_anagram_broken('кока-кола', 'коала-')  # повертає True, бо set видаляє повторення літер (к,о,а)
# is_anagram_broken('фанта', 'фанат')       # повертає True, бо set видаляє повторення літери (а)
# is_anagram_broken('куркума', 'кумар')     # повертає True, бо set видаляє повторення літер (к,у)

print(is_anagram_broken('listen', 'silent'))
print(is_anagram_broken('Listen', 'silent'))
print(is_anagram_broken("conversation", "voices rant on"))

print(t)

# для малої к-ті даних, різницю у швидкості непомітно
print(time_check(is_anagram_broken, 'Listen', 'silent'))  # час виконання: 0.00000170
print(time_check(is_anagram_broken_counter, 'Listen', 'silent'))  # час виконання: 0.00006470

# для великої к-ті даних різницю становиться помітно, Counter працює швидше
print(time_check(is_anagram_broken, 'Listen' * 50000, 'silent' * 50000))  # час виконання: 0.03061780
print(time_check(is_anagram_broken_counter, 'Listen' * 50000, 'silent' * 50000))  # час виконання: 0.02112910

print(t)

print(two_sum_broken([3, 1, 4], 6))  # (0,0)
print(two_sum([3, 1, 4], 6))  # None

print(t)

big = list(range(20_000))

print(time_check(two_sum_broken, big, -1))  # час виконання: 0.00310750
print(time_check(two_sum, big, -1))  # час виконання: 0.00244660
