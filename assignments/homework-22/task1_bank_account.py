# AI log: були проблеми з порядком перевірок у _check_amount (виправив порядок, додав math.isfinite і відсікання bool),
# з нулем за замовчуванням у __init__.

from math import isfinite


class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        if balance != 0 or isinstance(balance, bool):
            self._check_amount(balance)
        self._balance = balance

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        self._check_amount(amount)
        self._balance = self._balance + amount

    def withdraw(self, amount):
        self._check_amount(amount)
        if amount > self._balance:
            raise ValueError(f"Not enough money (balance: {self.balance}).")
        self._balance = self._balance - amount

    @staticmethod
    def _check_amount(amount):
        if not isinstance(amount, (int, float)) or isinstance(amount, bool) or not isfinite(amount) or amount <= 0:
            raise ValueError("Amount must be int or float and more than zero.")


acc = BankAccount("Ira", 100)
acc.deposit(50)
acc.withdraw(30)
print(acc.balance)  # 120

# acc.balance = 1000 # видасть помилку, що атрибут balance немає сеттера
# AttributeError: property 'balance' of 'BankAccount' object has no setter

# acc._balance = 1000
# працює, ми замінюємо наш схований атрибут без перевірки, це погана ідея,
# бо ми ігноруємо перевірки, через що можемо занести не валідні дані
