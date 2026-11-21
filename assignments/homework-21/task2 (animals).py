# AI log: none

class Animal:
    def __init__(self, name):
        self.name = name

    def talk(self):
        return f"[{self.__class__.__name__}] Name - {self.name}"


class Cat(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

    def talk(self):
        return super().talk() + f", breed - {self.breed}, sound - 'meow'"


class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

    def talk(self):
        return super().talk() + f", breed - {self.breed}, sound - 'woof woof'"


class Duck:
    def talk(self):
        return f"[{self.__class__.__name__}] Name - Duck, sound - 'quack'"


def general_func(items):
    print(items.talk())


animals_list = [
    Animal('Rio'),
    Cat('Tory', 'Ragdoll'),
    Dog('Ronny', 'spitz'),
]

for item in animals_list:
    general_func(item)

general_func(Duck())
# за качиною типізацією, якщо об'єкт виглядає як качка, звучить як качка, то це качка
# загальна функція працюватиме для класу Duck, ми можемо передавати різні класи, головне, щоб в класі був цей метод (talk())
