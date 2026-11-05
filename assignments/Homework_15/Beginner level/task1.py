def create_file(file_name="myfile.txt"):
    f = open(file_name, 'w',encoding="utf-8")
    f.write("Hello file world!\n")
    f.close()


def read_file(file_name="myfile.txt"):
    f = open(file_name, 'r',encoding="utf-8")
    g = f.read()
    f.close()
    return g

create_file(file_name="my_folder/myfile.txt")
read_file(file_name="my_folder/myfile.txt")

def create_file_v2(file_name="myfile.txt"):
    with open(file_name, 'w',encoding="utf-8") as f:
        f.write("Hello file world!\n")

def read_file_v2(file_name="myfile.txt"):
    with open(file_name, 'r',encoding="utf-8") as f:
        return f.read()

create_file_v2(file_name="my_folder/myfile.txt")
read_file_v2(file_name="my_folder/myfile.txt")

# myfile.txt з'явився у папці C:\Users\Admin\ тому що саме з цієї теки було запущено термінал
# При передаванні "my_folder/myfile.txt" в аргумент з'явиться помилка - FileNotFoundError: [Errno 2] No such file or directory: 'my_folder/myfile.txt'
# Але після створення цієї папки в директорії звідки запускається термінал, текстовий файл там успішно з'являється

# AI log: none