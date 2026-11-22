# AI log: none

def total_of(numbers):
    total = 0
    for n in numbers:
        try:
            total += n
        except TypeError:
            pass
    return total

print(total_of([1, 'df', 3]))

# 1. Реальне повідомлення про помилку - NameError: name 'nubmer' is not defined. Якщо функція обробить 10 000 записів із except: pass, вона тихо приховає 10 000 помилок NameError і поверне 0, створивши хибне враження успішного підрахунку
# 2. Базова функція вертає 0, через те що по перше в тілі функції є except: pass який ігнорує всі помилки і йде далі + змінна n ніде не використовується, тому значення для total не міняється і return total дає 0
# 3. У фінальній версії в except я додав TypeError, щоб функція ігнорувала строки в аргументах і працювала лише з числами, а помилка NameError: name 'nubmer' is not defined тепер ігноруватись не буде