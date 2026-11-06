# якщо в raise буде IndexError, то функція call_oops її не проігнорує і піде далі і падати не буде на цьому етапі
# Після того, яка я змінив raise з IndexError на KeyError, функція call_oops проігнорує помилку KeyError і програма впаде.
# Ось яка помилка виникне: (KeyError: 'Помилка')

def oops():
    raise KeyError("Помилка")

def call_oops():
    try:
        oops()
        # Очікуємо IndexError, тому що перша версія функції oops() генерувала саме цю помилку
    except IndexError:
        return 'IndexError'

call_oops()

# AI log: none