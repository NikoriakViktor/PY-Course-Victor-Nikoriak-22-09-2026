# AI log: попросив допомоги з логікою перевірки типів.

# Помилка для Dog("three"):
# ValueError: Please enter a valid age

# Помилка при заміні self.age_factor на age_factor:
# NameError: name 'age_factor' is not defined. Did you mean: 'self.age_factor'?

# NameError виникає, бо методи не бачать атрибутів класу напряму (тіло класу не є областю видимості).
# Пошук іде лише в локальній та глобальній областях, тому обов'язковий явний вказівник: self.age_factor або Dog.age_factor.

class Dog():
    age_factor = 7

    def __init__(self, age):
        self.validate(age)
        self.age = age

    def validate(self, age):
        if not isinstance(age, (int, float)):
            raise ValueError('Please enter a valid age')

    def human_age(self):
        return f"The dog's age ({self.age} years) in human years ({self.age * self.age_factor:.2f} years)."


dog1 = Dog(23)
print(dog1.human_age())

dog2 = Dog(3)
print(dog2.human_age())

dog3 = Dog(2.5)
print(dog3.human_age())

# dog4 = Dog("three")
