# AI log: попросив пояснити, чому атрибут класу не відображається в __dict__ екземпляра.

# Person.population виведе значення 2 (оскільки при створенні кожного екземпляра ми збільшуємо спільний атрибут класу),

# у словнику person1.__dict__ змінна population не з'явиться,
# бо цей атрибут видає словник всіх доступних атрибутів для конкретного екземпляра, які ми створили через self

class Person:
    population = 0

    def __init__(self, first_name, last_name, age):
        self.first_name = first_name
        self.last_name = last_name
        self.age = age
        Person.population += 1

    def get_greeting(self):
        return f"Hello, my name is {self.last_name} {self.first_name} and I`m {self.age} years old."

    def talk(self):
        print(self.get_greeting())


person1 = Person('Danny', 'Phantom', 14)
person2 = Person('Ben', 'Tennyson', 15)

person1.talk()
person2.talk()

print(Person.population)
print(person1.__dict__)
