import random
import time

#Складність функції O(n**2), тому що в циклі іде обхід по всім елементам першого списка, кількість якого є n
#Умова if також виконує обхід по другому циклу для перевірки наявності елемента першого списку і другому. І, у найгіршому випадку, обхід буде по всьому другому циклу
def question1(first_list, second_list):
    res = []
    for el_first_list in first_list:
        if el_first_list in second_list:
            res.append(el_first_list)
    return res


def common_elements_fast(first_list, second_list):
    res = []
    second_set = set(second_list)

    for el_first_list in first_list:
        if el_first_list in second_set:
            res.append(el_first_list)
    return res

n = 400000

f_l = [random.randint(1, 2 * n) for _ in range(n)]
s_l = [random.randint(1, 2 * n) for _ in range(n)]

"""
times = []
for _ in range(5):
    start = time.perf_counter()
    question1(f_l, s_l)
    times.append(time.perf_counter() - start)
print(f"question1, {n}:", min(times))
"""

times = []
for _ in range(5):
    start = time.perf_counter()
    common_elements_fast(f_l, s_l)
    times.append(time.perf_counter() - start)
print(f"common_elements_fast, {n}:", min(times))

"""
n = 100000
question one time: 54.31183750042692 секунд
common elements fast time: 0.0202735997736454 секунд

Надалі виконується тільки швидка функція через те що question1 займає занадто багато часу

n = 200000
common elements fast time: 0.05377810029312968 секунд

n = 400000
common elements fast time: 0.13095010025426745 секунд
"""