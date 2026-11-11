def favorite_movie(movie):
    return f"My favorite movie is named {movie}"

new_string = "2008: The Curious Case of Benjamin Button"

print(favorite_movie(new_string))
favorite_movie("Dune")

def favorite_movie_2(movie):
    print(f"My favorite movie is named {movie}")

print(favorite_movie_2(new_string))

"""

Строка 6 виведе у терміналі "мій улюблений фільм про Бенжаміна Баттона"
Строка 7 виведе нічого, тому що функція favorite_movie повертає рядок
Строка 12 також виведе у терміналі "мій улюблений фільм про Бенжаміна Баттона", а потім None.
Так виходить через те, що функція favorite_movie_2 прінтує рядок "мій улюблений фільм про Бенжаміна Баттона"
Але ця ж функція в свою чергу повертає None за замовчуванням, якщо return не прописаний у функції

"""