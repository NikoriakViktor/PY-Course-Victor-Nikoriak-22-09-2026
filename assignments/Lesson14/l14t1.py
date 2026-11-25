def oops(l):
    length = len(l) * 2
    i = 0

    while i < length:
        print(l[i])
        i += 1

def try_oops(l):
    try:
        oops(l)
    except IndexError:
        print("Oops, the function 'oops' has exceeded its index!")

# KeyError: 0 виникла помилка і код передвчасно закінчив своє виконання
# Так сталось тому, що try_oops(l) не обробляє випадок виключно KeyError
l = {1:'1', 2:'2', 3:'3', 4:'4', 5:'5'}
try_oops(l)