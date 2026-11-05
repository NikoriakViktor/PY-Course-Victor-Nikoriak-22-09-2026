import os

# create_file(file_name="files/myfile.txt") видає помилку, тому що папка не існує
# треба створити папку file вручну
def create_file(file_name="files/myfile.txt"):
    file = open(file_name, "w", encoding="utf-8")
    try:
        file.write("Hello file world!\nHello world\nWorld hello!\nThe last line")
    finally:
        file.close()

def read_file(file_name="files/myfile.txt"):
    file = open(file_name, "r", encoding="utf-8")

    try:
        content = file.read()
        print(content)
    finally:
        file.close()

def create_file_v2(file_name="myfile_v2.txt"):
    with open(file_name, "w") as file:
        file.write("Hello file v2 world!")
        file.close()

def read_file_v2(file_name="myfile_v2.txt"):
    with open(file_name, "r") as file:
        content = file.read()
        print(content)
        file.close()    

create_file()
read_file()
create_file_v2()
read_file_v2()

# C:\Users\R&D\Desktop\Beetroot Python\github\PY-Course-Victor-Nikoriak-22-09-2026\assignments\Lesson15\myfile.txt
# Шлях такий, тому що був заданий відносний шлях. Python викорстовує в такому випадку папку, з якої був запущений скрипт
print(os.path.abspath("myfile.txt"))