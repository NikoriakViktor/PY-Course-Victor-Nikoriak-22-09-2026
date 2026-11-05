def count_lines(file_name):
    with open(file_name, "r", encoding="utf-8") as file:
        lines = len(file.readlines())
        file.close()
        return lines 

def count_chars(file_name):
    with open(file_name, "r", encoding="utf-8") as file:
        chars = len(file.read())
        file.close()
        return chars
    
def test(file_name):
    print(
        f"File name: {file_name}\nLines count: {count_lines(file_name)}\nChars count: {count_chars(file_name)}\n"
    )

#-----------------------------------------------
# Результат виконання команди wc -l -c myfile.txt:
# Vanya@DESKTOP-1BFJLJ9 UCRT64 ~/Desktop/Beetroot Python/github/PY-Course-Victor-Nikoriak-22-09-2026/assignments/Lesson15/files (Homework-15---Files-I/O,-context-managers,-JSON)
# $ wc -l -c myfile.txt
# 3 59 myfile.txt
#-----------------------------------------------
# Результат виконання файлу mymod.py:
# File name: files/myfile.txt
# Lines count: 4
# Chars count: 56
#-----------------------------------------------
# Висновки:
# Результати різні. Скрипт mymod.py рахує всі рядки, в тому числі і перший,
# який не містить явного переносу рядка \n
# консольна команда wc -l -c myfile.txt в свою чергу рахує тільки \n як рядки.
# Кількість символів також різна. У скрипта нараховано 56, а у консольної команди 59.
# Це обувлено тим, що метод read() не рахує перенос рядка \n як символ, 
# а консольна команда - рахує

test("files/myfile.txt")