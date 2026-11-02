#Строка, отримана від юзера
message = input("Please write a message: ")

#Оголошення лічільників для літер, цифр і пунктуаційних знаків
chars_count = 0
digits_count = 0
punctuations_count = 0

#Цикл, який міняє значення лічильників при відповідності умови
for i in range(len(message)):
    if message[i] == " ":
        continue
    elif message[i].isalpha():
        chars_count += 1
    elif message[i].isdigit():
        digits_count += 1
    else:
        punctuations_count += 1

#Очікуваний результат: 2 літери, 4 цифри, 2 пунктуаційних знаки
print("Chars:", chars_count, "Digits:", digits_count, "Punctuations:", punctuations_count)