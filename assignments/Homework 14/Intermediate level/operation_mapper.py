def operation_mapper(operation: str):
    ops = {
        "+": lambda a, b: a + b,
        "-": lambda a, b: a - b,
        "*": lambda a, b: a * b,
        "/": lambda a, b: a / b,
        "**": lambda a, b: a ** b,
    }
    if operation not in ops:
        raise ValueError("Operation not supported")
    return ops[operation]

print(operation_mapper("+")(1, 2))   # 3
print(operation_mapper("**")(2, 10)) # 1024
print(operation_mapper("%"))

# 1. Якщо шукати операцію, якої не існує у словнику за умови що ми явно викликаємо ValueError, Python видасть помилку KeyError: '//'
# Наш штучний ValueError кращий, тому що KeyError: '//' по контексту не зрозумілий користувачу а Operation not supported куди легше зрозуміти
# 2. Помилку ділення на нуль (ZeroDivisionError) має обробляти код який її викликає, тому що тільки він знає контекст програми, функція це просто калькулятор. Якщо базова функція приховає помилку і поверне заглушку (наприклад None), це непомітно зламає подальші математичні обчислення в іншому місці.

# AI log: попросив у AI щоб він мені пояснив як працює lambda і як використати список. Код я вже написав сам