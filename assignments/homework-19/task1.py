# AI log: запитав у ментора, що таке атрибут __code__ і що роблять co_varnames та co_nlocals, з'ясував, що функція — це об'єкт,
# а ці атрибути зберігають скомпільовані дані про імена та кількість її локальних змінних (включно з параметрами).

def make_order(item, qty=1):
    price = 100
    total = price * qty
    return f"{qty} x {item}: {total}"


def count_locals(func):
    print(f"Кортеж всіх доступних змінних: {func.__code__.co_varnames}")
    return func.__code__.co_nlocals


count = count_locals(make_order)
print(f"Загальна кількість: {count}")
