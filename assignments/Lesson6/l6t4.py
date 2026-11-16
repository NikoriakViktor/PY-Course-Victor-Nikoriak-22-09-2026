sentence = "That bus that I saw yesterday on Monday left right in front of my face"
words = sentence.split(" ")
frequencies = {words[i].lower():0 for i in range(len(words))}

for i in words:
    frequencies[i.lower()] += 1

#Очікуваний результат:
#'that': 2, 'bus': 1, 'i': 1, 'saw': 1, 'yesterday': 1,
#'on': 1, 'monday': 1, 'left': 1, 'right': 1, 'in': 1, 'front': 1, 'of': 1, 'my': 1, 'face': 1
print(frequencies)