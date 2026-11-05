def linear_search(items, target):
    comparisons = 0

    for i in items:
        comparisons += 1    
        if i == target:
            return (comparisons - 1, comparisons)  

    return (-1, comparisons)

def binary_search(items, target):
    comparisons = 0
    low = 0
    high = len(items) - 1
    
    while low <= high:
        mid = (low + high) // 2
        comparisons += 1

        if items[mid] == target:
            return (mid, comparisons)
        elif items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return (-1, comparisons)

numbers = list(range(0, 200, 2))
l_res_1 = linear_search(numbers, 198)
l_res_2 = linear_search(numbers, 42)
l_res_3 = linear_search(numbers, 7)
b_res_1 = binary_search(numbers, 198)
b_res_2 = binary_search(numbers, 42)
b_res_3 = binary_search(numbers, 7)

#Лінійна функція поушуку для значення 198 потребує 100 порівнянь, так як занчення 198 порівнюється з кожним значенням списку
#Бінарна функція з кожним кроком наближається до відповіді в два рази. У нашому списку 100 елементів
#логарифм з основую два від 100 буде в межах 6 і 7. Тому максимальна кількість кроків у бінарного пошуку у даному випадку
#дорівнює 7
print(f"198 -> linear: index {l_res_1[0]}, {l_res_1[1]} comparisons | binary: index {b_res_1[0]}, {b_res_1[1]} comparisons")
#Лінійна функція, кількість порівнянь: 22
#Бінарна функція кількість порівнянь: 7
print(f"198 -> linear: index {l_res_2[0]}, {l_res_2[1]} comparisons | binary: index {b_res_2[0]}, {b_res_2[1]} comparisons")
#Лінійна функція, кількість порівнянь: 100
#Бінарна функція кількість порівнянь: 7
print(f"198 -> linear: index {l_res_3[0]}, {l_res_3[1]} comparisons | binary: index {b_res_3[0]}, {b_res_3[1]} comparisons")
