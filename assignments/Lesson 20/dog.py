class Dog:
    age_factor = 7

    def __init__(self, age):
        self.validate(age)
        self.age = age


    def validate(self, age):
        if not isinstance(age, (int, float)):
            raise TypeError("Wrong value. The value must be a number")

    def human_age(self):
        # ми не можемо використовувати age_factor замість self.age_factor
        # тому що age_factor це атрибут класу Dog
        return round(self.age * self.age_factor, 2)


hasky = Dog(3)
labrador = Dog(2.5)

#  File "c:/Users/R&D/Desktop/Beetroot Python/github/PY-Course-Victor-Nikoriak-22-09-2026/assignments/Lesson 20/dog.py", line 5, in __init__
#    self.validate(age)
#    ~~~~~~~~~~~~~^^^^^
#  File "c:/Users/R&D/Desktop/Beetroot Python/github/PY-Course-Victor-Nikoriak-22-09-2026/assignments/Lesson 20/dog.py", line 11, in validate
#    raise TypeError("Wrong value. The value must be a number")
# TypeError: Wrong value. The value must be a number
# mops = Dog("three")


print(hasky.age)
print(hasky.human_age())
print(labrador.age)
print(labrador.human_age())
