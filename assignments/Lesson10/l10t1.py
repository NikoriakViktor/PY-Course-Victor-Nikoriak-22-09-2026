def get_greeter():
    def greeter(name):
        return name

    return greeter

#Рядок 9 виведе об'єкт типу function
#Рядок 10 виведе Olena, тому що виконається функція greeter з переданим значенням Olena параметру name
print(get_greeter())
print(get_greeter()("Olena"))