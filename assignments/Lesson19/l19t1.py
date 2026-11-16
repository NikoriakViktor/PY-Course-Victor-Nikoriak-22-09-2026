def make_order(item, qty=1):
    price = 100
    total = price * qty
    return f"{qty} x {item}: {total}"

def count_locals(func):
    print(f"Кількість локальних змінних у функції {func.__name__}: {func.__code__.co_nlocals}")
    print(f"Локальні змінні у функції {func.__name__}: {func.__code__.co_varnames}")

# Очікуваний результат:
# ---------------------
# Кількість локальних змінних у функції make_order: 4
# Локальні змінні у функції make_order: ('item', 'qty', 'price', 'total')
# ---------------------
# Отриманий результат:
# ---------------------
# Кількість локальних змінних у функції make_order: 4
# Локальні змінні у функції make_order: ('item', 'qty', 'price', 'total')
count_locals(make_order)