# AI log: за допомогою ментора виправив логіку збереження даних у словник та оптимізував умову пошуку в алгоритмі Two Sum,
# розібрався, як однопрохідний цикл впливає на порядок індексів у фінальному результаті.

from collections import Counter

text = "the cat and the dog and the bird and the cat"
counts = {}

for word in text.split():
    counts[word] = counts.get(word, 0) + 1

print(counts)

top_3 = sorted(counts.items(), key=lambda xy: xy[1], reverse=True)[:3]
print(top_3)

print(Counter(text.split()).most_common(3))


def two_sum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        if target - num in seen:
            return seen[target - num], i

        seen[num] = i

    return None


nums = [11, 2, 15, 7, 26, 19]

print(two_sum(nums, 9))  # поверне індекси (1, 3), бо з їхньої суми отримаємо 9
print(two_sum(nums, 26))  # поверне індекси (0, 2), бо з їхньої суми отримаємо 26
print(two_sum(nums, 100))  # поверне None, бо з суми цих значень не отримати 100

# two_sum для target 9 повертає (1, 3), а не (3, 1), тому що ми проходимо послідовно всі елементи списку, і деяких значень для порівняння
# ще не було додано в наш словник
