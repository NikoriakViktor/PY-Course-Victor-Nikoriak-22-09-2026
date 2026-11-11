import string

def group_anagrams(words):
    anagrams = {}

    for word in set(words):
        w = word.lower().translate(str.maketrans("", "", string.punctuation))
        letters = "".join(sorted(w))

        anagrams.setdefault(letters, []).append(w)

    return list(anagrams.values())


with open("assignments/Lesson17/example.txt", "r", encoding="utf-8") as file:
    cleaned_words = file.read().lower().translate(str.maketrans("", "", string.punctuation)).split(" ")
    angrms = group_anagrams(cleaned_words)
    test = ["eat", "tea", "tan", "ate", "nat", "bat"]
    res1 = group_anagrams(test)
    sorted_groups = sorted(angrms, key=len, reverse=True)
    print(f"Three the most common:\n{sorted_groups[:3]}")
    file.close()