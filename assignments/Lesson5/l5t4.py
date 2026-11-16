import random

numbers = []
i = 0
#Bug:
#запис list.append(smth) повертає нічого
#тому numbers.append(random.randint(1, 5)) у записі
# numbers = numbers.append(random.randint(1, 5))
#записує в змінну numbers None
"""
File "c:/Users/R&D/Desktop/Beetroot Python/Lesson5/l5t4.py", line 6, in <module>
    numbers = numbers.append(random.randint(1, 5))
              ^^^^^^^^^^^^^^
AttributeError: 'NoneType' object has no attribute 'append'
"""
while i < 10:
    numbers.append(random.randint(1, 5))
    i += 1

unique_numbers = set()
i = 0

#Bug:
#Фігурні скобки {} викорстовуються не тільки для визначення об'єкту типу set,
#а також для визначення об'єкту типу dict. Тому змінну ungique_numbers краще
#оголошувати як unique_numbers = set()
"""
 File "c:/Users/R&D/Desktop/Beetroot Python/Lesson5/l5t4.py", line 19, in <module>
    unique_numbers.add(numbers[i])
    ^^^^^^^^^^^^^^^^^^
AttributeError: 'dict' object has no attribute 'add'
"""
while i < len(numbers):
    unique_numbers.add(numbers[i])
    i += 1

print("All numbers:", numbers)
print("Unique numbers:", unique_numbers)