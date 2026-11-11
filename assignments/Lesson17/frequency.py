from collections import Counter

text = "the cat and the dog and the bird and the cat"

counts = {}

for word in text.split(" "):
    if not counts.get(word):
        counts[word] = 1
    else:
        counts[word] += 1

print(text)
# 1. Prints counts
for i, c in counts.items():

    print(f"Word: {i}\nCounts: {c}\n")

# 2. Prints the first 3 most frequent words 
for i, c in sorted(counts.items(), key=lambda x: x[1], reverse=True):

    print(f"Word: {i}\nCounts: {c}\n")

# 3. The same but with Counter()
with_counter = Counter(text.split()).most_common(3)

for c in with_counter:
    print(f"Word: {c[0]}\nCounts: {c[1]}\n")

# 4. 
seen = {}
nums = [11, 2, 15, 7, 26, 19]
targets = [9, 26, 100]
def two_sums(nums, target):
    for i, v in enumerate(nums):
        a = target - v
        if seen.get(f"{a}"):
            return (i, seen[f"{a}"])
        else:
            seen[f"{v}"] = i

    return None

# Для target = 9 повертає (3, 1) тому що значення 2 у nums стоїть раніше за 7
# Якщо поміняти місцями 2 і 7 у списку nums, то функція поверне кортеж (1, 3)
# Пояснюється така поведінка тим, що значення 2 знайшлось і записалось у словник seen
# раніше, ніж функція встигла дійти до значення 7
# return (i, seen[f"{a}"]) цей рядок повертає кортеж з індексом поточного елементу зі списку і індексом
# елемента, знайденого раніше і записаного у словник seen
for t in targets:
    print(two_sums(nums, t))