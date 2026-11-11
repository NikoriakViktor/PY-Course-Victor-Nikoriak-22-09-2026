import mymod

if __name__ == "__main__":
    lines = ["adfsfsadfsda\nfdsa sdaf fds afdsa",
        "fdsasdffda asdf fads\n"
        "afdasdf afds\n"
        " asdf afds\n"
        "fads  adsf adsf\n"
        "fa dsfdas dsffds",
        "123 ididosl oslasowe lorem ipsum s"
        "sdfa"
    ]

    for l in lines:
        mymod.test(l)

# Відповідь на питання: does the folder where you created mymod.py need to be in sys.path for the import to work, and why?
# Так, папка потрібна бути у sys.path, якщо ми імпортуємо кастомну функцію, тому що за замовчуванням Python бачить 
# бачить файли і папки в тій же директорії, де знаходиться сам скрипт з імпортом
# якщо ж кастомний модуль знаходиться за межами поточної папки, то тоді потрібно додати шлях до цього модуля через sys.path