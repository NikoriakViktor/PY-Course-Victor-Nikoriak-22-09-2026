# AI log: розібрав із ментором @property і сетер та різницю зі старою версією.

from math import isfinite


class Dog:
    age_factor = 7

    def __init__(self, age):
        self.age = age

    @property
    def age(self):
        return self._age

    @age.setter
    def age(self, value):
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise TypeError('Please enter a valid age')
        if value <= 0 or not isfinite(value):
            raise ValueError('Please enter a valid age')
        self._age = value

    @property
    def human_age(self):
        return round(self.age * self.age_factor, 2)


d = Dog(3)
print(d.human_age)  # 21
d.age = 2.5
print(d.human_age)  # 17.5

try:
    Dog("three")  # TypeError
except TypeError as e:
    print(f"Error: {e}")

try:
    d.human_age = 5  # AttributeError
except AttributeError as e:
    print(f"Error: {e}")

# в старому коді human_age був звичайним методом (викликали з дужками), а age був звичайним атрибутом,
# в новому коді human_age став @property (звертаємось без дужок), і спроба присвоїти йому значення дає помилку AttributeError, бо сеттера немає
# старий виклик d.human_age() ламається, бо зараз human_age повертає число, а виклик від числа дає помилку

# використання @property дає звичний варіант запису, ніби ми працюємо зі звичайним атрибутом,
# замість прямого доступу до поля тепер спрацьовують геттер і сетер із перевірками, а дані ховаються в _age.
