import random

numbers = []
max_num = 0

i = 0

while i < 10:
    numbers.append(random.randrange(100000))
    i += 1

i = 0

while i < 10:
    if numbers[i] > max_num:
        max_num = numbers[i]

    if i < 3:
        print(f"The largest number so far: {max_num}")

    i += 1

print(numbers)
print(max_num)
print(max(numbers))