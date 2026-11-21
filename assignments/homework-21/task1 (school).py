# AI log: розібрав логіку роботи issubclass

class Person:
    def __init__(self, name):
        self.name = name

    def introduce(self):
        return f"[{self.__class__.__name__}] Name - {self.name}"


class Teacher(Person):
    def __init__(self, name, salary):
        super().__init__(name)
        self.salary = salary

    def introduce(self):
        return super().introduce() + f", salary - {self.salary}"


class Student(Person):
    def __init__(self, name, average_rating):
        super().__init__(name)
        self.average_rating = average_rating

    def introduce(self):
        return super().introduce() + f", average rating - {self.average_rating}"


post_list = [
    Person('John'),
    Teacher('Michael', 500),
    Student('Jeffery', '90/100')
]

for item in post_list:
    print(item.introduce())

print(isinstance(post_list[1], Person))  # True
print(isinstance(post_list[1], Student))  # False
print(issubclass(Teacher, Person))  # True # перевіряє чи є клас - підкласом іншого класу
