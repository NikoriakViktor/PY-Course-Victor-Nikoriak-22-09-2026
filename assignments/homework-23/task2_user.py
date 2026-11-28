# AI log: разом із ментором розібрав баги у валідації email, спростив логіку умов і повернення True/False,
# виніс перевірки префікса та домену в окремі функції.

import string

ALPHANUMERIC_CHARS = string.ascii_letters + string.digits
ALPHANUMERIC_TUPLE = tuple(ALPHANUMERIC_CHARS)

ALLOWED_PREFIX_CHARS = {ch for ch in ALPHANUMERIC_CHARS + '_.-'}
BAD_PREFIX_SEQUENCES = {'--', '..', '.-', '-.', '__', '_-', '-_', '_.', '._'}

ALLOWED_DOMAIN_CHARS = {ch for ch in ALPHANUMERIC_CHARS + '-.'}
BAD_DOMAIN_SEQUENCES = {'--', '..', '.-', '-.'}


class User:
    def __init__(self, name, email):
        if not User.validate(email):  # якщо валідація не пройдена - ValueError
            raise ValueError("Email is not valid")
        self.name = name
        self.email = email

    # обрав @staticmethod, щоб створити простий метод без отримання self,
    # в @classmethod не бачу сенсу, нашому методу не потрібні дані, ні самого екземпляра, ні сам клас чи його атрибути

    # валідація(перевірка) емейлу за правилами
    @staticmethod
    def validate(email):
        # якщо емейл не рядок, або кількість '@' не 1 - False
        if not isinstance(email, str) or email.count('@') != 1:
            return False

        # розділення емейлу на частини за '@'
        prefix, domain = email.split('@')

        return (User._is_valid_prefix(prefix)
                and User._is_valid_domain(domain))

    # перевірка prefix
    @staticmethod
    def _is_valid_prefix(prefix):
        # чи є символ якого немає в ALLOWED_PREFIX_CHARS
        # чи є повторення знаків пунктуації
        # чи не починається/закінчується рядок на букви або числа
        if (not prefix
                or any(ch not in ALLOWED_PREFIX_CHARS for ch in prefix)
                or any(pair in prefix for pair in BAD_PREFIX_SEQUENCES)
                or not prefix.startswith(ALPHANUMERIC_TUPLE)
                or not prefix.endswith(ALPHANUMERIC_TUPLE)):
            return False
        return True

    # перевірка domain
    @staticmethod
    def _is_valid_domain(domain):
        labels = domain.split('.')

        # чи є символ якого немає в ALLOWED_DOMAIN_CHARS
        # чи є повторення знаків пунктуації
        if (any(ch not in ALLOWED_DOMAIN_CHARS for ch in domain)
                or any(pair in domain for pair in BAD_DOMAIN_SEQUENCES)
                or any(not label
                       or not label.startswith(ALPHANUMERIC_TUPLE)
                       or not label.endswith(ALPHANUMERIC_TUPLE)
                       for label in labels)
                or len(labels) < 2
                or len(labels[-1]) < 2):
            return False
        return True


assert User.validate("abc.def@mail.com") is True
assert User.validate("abc-@mail.com") is False
assert User.validate("abc..def@mail.com") is False
assert User.validate("abc.def@mail.c") is False

try:
    User("Ira", "ira@@mail.com")  # ValueError
except ValueError as e:
    print(f"Error: {e}")

# (email, expected)
emails = (('abc-@mail.com', False),
          ('abc-d@mail.com', True),
          ('abc..def@mail.com', False),
          ('abc.def@mail.com', True),
          ('.abc@mail.com', False),
          ('abc@mail.com', True),
          ('abc#def@mail.com', False),
          ('abc_def@mail.com', True),
          ('abc.def@mail.c', False),
          ('abc.def@mail.cc', True),
          ('abc.def@mail#archive.com', False),
          ('abc.def@mail-archive.com', True),
          ('abc.def@mail', False),
          ('abc.def@mail.org', True),
          ('abc.def@mail..com', False),
          ('abc.def@mail.com', True))

for email, expected in emails:
    actual = User.validate(email)
    assert actual == expected, (f"Помилка для '{email}': "
                                f"отримано {actual}, "
                                f"очікувалося {expected}")
    print(f"Email: '{email}' | "
          f"Фактичний: {actual} | "
          f"Очікуваний: {expected}")

# Email: 'abc-@mail.com' | Фактичний: False | Очікуваний: False
# Email: 'abc-d@mail.com' | Фактичний: True | Очікуваний: True
# Email: 'abc..def@mail.com' | Фактичний: False | Очікуваний: False
# Email: 'abc.def@mail.com' | Фактичний: True | Очікуваний: True
# Email: '.abc@mail.com' | Фактичний: False | Очікуваний: False
# Email: 'abc@mail.com' | Фактичний: True | Очікуваний: True
# Email: 'abc#def@mail.com' | Фактичний: False | Очікуваний: False
# Email: 'abc_def@mail.com' | Фактичний: True | Очікуваний: True
# Email: 'abc.def@mail.c' | Фактичний: False | Очікуваний: False
# Email: 'abc.def@mail.cc' | Фактичний: True | Очікуваний: True
# Email: 'abc.def@mail#archive.com' | Фактичний: False | Очікуваний: False
# Email: 'abc.def@mail-archive.com' | Фактичний: True | Очікуваний: True
# Email: 'abc.def@mail' | Фактичний: False | Очікуваний: False
# Email: 'abc.def@mail.org' | Фактичний: True | Очікуваний: True
# Email: 'abc.def@mail..com' | Фактичний: False | Очікуваний: False
# Email: 'abc.def@mail.com' | Фактичний: True | Очікуваний: True