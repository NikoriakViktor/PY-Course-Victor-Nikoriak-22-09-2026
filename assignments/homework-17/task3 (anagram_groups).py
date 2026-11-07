# AI log: за допомогою підказок від ментора налаштував фільтрацію дублікатів через set() у генераторі списків,
# реалізував автоматичне читання .txt файлів через os.listdir() та провів Code Review рішення від ШІ,
# виявивши його недоліки в роботі з реальним текстом.

# Код від ШІ компактніший, але зовсім не підходить для реальних текстів.
# На відміну від мого рішення, він ігнорує пунктуацію, залишає дублікати та не відфільтровує надто короткі слова.
# Наприклад, якщо передати дані ["Сенс", "сенс,"], ШІ створить дві окремі групи (['Сенс'], ['сенс,']), бо не вміє обробляти регістр та розділові знаки.

import os

from string import punctuation

t = '-' * 50


def group_anagrams(words):
    groups = {}

    for word in words:
        clean_word = word.strip(punctuation).lower()

        if len(clean_word) > 2:
            key = ''.join(sorted(clean_word))
            groups.setdefault(key, []).append(clean_word)

    return sorted([set(value) for value in groups.values() if len(set(value)) > 1],
                  key=lambda x: len(x), reverse=True)[:3]


print(t)

print(group_anagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']))

print(t)

try:
    for filename in os.listdir(os.getcwd()):

        if filename.endswith(".txt"):
            with open(filename, encoding='utf-8') as f:
                f_words = f.read().split()

                if not f_words:
                    print(f"файл - ({filename}), анаграми - немає")

                else:
                    print(f"файл - ({filename}), анаграми - {group_anagrams(f_words)}")

except Exception as e:
    print(e)

print(t)

# код від ШІ:

# def group_anagrams(words):
#     groups = {}
#
#     for word in words:
#         key = "".join(sorted(word))
#
#         groups.setdefault(key, []).append(word)
#
#     return list(groups.values())
#
# print(group_anagrams(["Сенс", "сенс,"]))  # код від ШІ створює дві окремі групи (['Сенс'], ['сенс,']), хоча це два однакових слова
