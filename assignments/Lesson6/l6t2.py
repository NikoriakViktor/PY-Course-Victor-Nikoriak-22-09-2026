squares_cl = [(i, i**2) for i in range(1, 11)]
squares_fl = []

for i in range(1, 11):
    squares_fl.append((i, i**2))

#Легше читати варіант з цилом for, тому що наявно видно, як додаються елементи покрово у список через цикл
#Проте варіант з comprehension list більш компактний, який займає всього один рядок

print("A list of tuples using comprehension list: ", squares_cl)
print("A list of tuples using for loop: ", squares_fl)