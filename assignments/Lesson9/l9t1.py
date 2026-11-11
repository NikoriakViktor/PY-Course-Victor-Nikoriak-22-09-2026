#Складність функції O(n**2), тому що в циклі іде обхід по всім елементам першого списка, кількість якого є n
#Умова if також виконує обхід по другому циклу для перевірки наявності елемента першого списку і другому. І, у найгіршому випадку, обхід буде по всьому другому циклу
def question1(first_list, second_list):
    res = []
    for el_first_list in first_list:
        if el_first_list in second_list:
            res.append(el_first_list)
    return res

#Складність O(1), тому що у циклі функції кількість обходів є константою, яка дорівнює 10
def question2(n):
    for _ in range(10):
        n *= 3
    return n

#Складність O(n**2), тому що обхід іде повністю по другому списку, а далі всередині цього циклу обхід по першому циклу
#Хоча у нас і є умова виходу з циклу, але у найгіршому випадку, умова може ні разу не спрацювати, тому і складність буде O(n**2)
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

#Складність O(n), тому що функція виконує обхід по всім елементам вхідного списку
def question4(input_list):
    res = input_list[0]
    for el in input_list:
        if el > res:
            res = el
    return res

#Складність O(n**2), тому що функція два цикли, один з яких всередині іншого, а кількість обходів у обох циклаї є n
def question5(n):
    res = []
    for i in range(n):
        for j in range(n):
            res.append((i, j))
    return res

#Складність O(log n), тому що у циклі функція наближає вихід з циклу у два рази з кожною ітерацією
def question6(n):
    while n > 1:
        n //= 2
    return n
