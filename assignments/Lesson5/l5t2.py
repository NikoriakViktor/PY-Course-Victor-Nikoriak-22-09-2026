integers_list = [i for i in range(1, 101)]
result = []
i = 0

while i < len(integers_list):
    number = integers_list[i]

    if number % 7 == 0 and not number % 5 == 0:
        result.append(number)

    i += 1
"""
Перші три очікуваних числа у списку: 7, 14, 21. 35 опущено, тому що це число є дільником
числа 5, а це не відповідає умові задачи. За умовою числа у результуючому списку
мають бути дільником числа 7 і також не бути дільником числа 5
"""

print(result)