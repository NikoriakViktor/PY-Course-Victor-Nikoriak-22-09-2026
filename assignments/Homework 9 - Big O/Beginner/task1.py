def question1(first_list, second_list):
    res = []
    for el_first_list in first_list:
        if el_first_list in second_list:
            res.append(el_first_list)
    return res
# O(n^2): визначає зовнішній for in та внутрішній if in

def question2(n):
    for _ in range(10):
        n *= 3
    return n
# O(1): визначає цикл for _ in range(10), скільки б значень не було код буде обчислювати 10 значень

def question3(first_list, second_list):
    temp = first_list[:]
    for el_second_list in second_list:
        flag = False
        for check in temp:
            if el_second_list == check:
                flag = True
                break
        if not flag:
            temp.append(el_second_list)
    return temp
# n + n^2 * 1 = O(n^2): визначає вкладений цикл for

def question4(input_list):
    res = input_list[0]
    for el in input_list:
        if el > res:
            res = el
    return res
# 1 + n * 1 = 1 + n = O(n): визначає цикл for

def question5(n):
    res = []
    for i in range(n):
        for j in range(n):
            res.append((i, j))
    return res
# O(n^2): визначає вкладений цикл for

def question6(n):
    while n > 1:
        n //= 2
    return n
# O(log n): визначає n //= 2

# AI log: Gemini. Запитав про складність question1 та question3. Наші відповіді повністю збіглися — обидві функції мають складність O(n^2). Ми зійшлися на тому, що у question3 є очевидні вкладені цикли, а у question1 оператор 'in' (if el_first_list in second_list) працює під капотом як прихований цикл, що разом із зовнішнім for дає квадратичну складність