import random

first_list = [random.randint(1, 10) for i in range(10)]
second_list = [random.randint(1, 10) for i in range(10)]
intersections = []

i = 0
j = 0

while i < len(first_list):
    while j < len(second_list):
        if first_list[i] == second_list[j]:
            intersections.append(first_list[i])

        j += 1

    j = 0
    i += 1

intersections = list(set(intersections))

"""
First list: [3, 5, 6, 2, 8, 2, 6, 9, 7, 1]
Second list: [8, 4, 4, 4, 4, 2, 6, 10, 8, 7]

Очікуваний результат: список з 2, 6, 8, 7
Отриманий результат програмою: список з 8, 2, 6, 7

Обчислені результати власноруч і програмою збігаються
"""

print("First list:", first_list)
print("Second list:", second_list)
print(intersections)