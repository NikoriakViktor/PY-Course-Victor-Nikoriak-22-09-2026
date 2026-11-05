# AI log: використано для перекладу завдання та пояснення що саме потрібно зробити в завданні,
# також для допомоги з розумінням помилок в моєму коді

#O(n²)
def question1(first_list, second_list):
    res = []
    for el_first_list in first_list:
        if el_first_list in second_list:
            res.append(el_first_list)
    return res

#O(1)
def question2(n):
    for _ in range(10):
        n *= 3
    return n

#O(n²)
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

#O(n)
def question4(input_list):
    res = input_list[0]
    for el in input_list:
        if el > res:
            res = el
    return res

#O(n²)
def question5(n):
    res = []
    for i in range(n):
        for j in range(n):
            res.append((i, j))
    return res

#O(log n)
def question6(n):
    while n > 1:
        n //= 2
    return n

# AI log: запитала ШІ (Claude) про складність question1 і question3.
# Відповіді збіглися з моїми окрім 1
# question2: я спочатку вважала що O(1), але мала сумніви і поставила O(n), а ШІ пояснив, чому O(1)