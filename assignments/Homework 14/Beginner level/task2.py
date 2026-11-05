def my_math():
    a, b = input("Ведіть перше число: "), input("Ведіть друге число: ")

    try:
        a, b = float(a), float(b)
        result = (a ** 2) / b
    # Очікуємо ValueError, якщо користувач введе літери замість чисел
    except ValueError:
        print("Вводь тільки цифри")
    # Очікуємо ZeroDivisionError, бо користувач може ввести 0 як друге число
    except ZeroDivisionError:
        print("На нуль ділити не можна")
    else:
        return result

# AI log: none