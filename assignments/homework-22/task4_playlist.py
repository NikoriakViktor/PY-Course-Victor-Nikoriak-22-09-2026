# AI log: розібрав із ментором, чому зайве self.duration = 0 дає помилку без сетера і як працює внутрішній атрибут _songs замість __songs.

class Playlist:
    def __init__(self, name):
        self.name = name
        self._songs = []

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if not value:
            raise ValueError("Playlist name can't be empty")
        self._name = value

    @property
    def duration(self):
        return sum(seconds for _, seconds in self._songs)

    def add(self, title, seconds):
        self._songs.append((title, seconds))


class PartyPlaylist(Playlist):
    def first_song(self):
        return self._songs[0]


p = PartyPlaylist("Friday")
p.add("Song A", 200)
p.add("Song B", 180)
print(p.name, p.duration)  # Friday 380
print(p.first_song())  # ('Song A', 200)

# Помилка 1: треба викликати self._name, а не self.name, щоб уникнути помилки вічного циклу, бо інакше геттер буде викликати сам себе.
# RecursionError: maximum recursion depth exceeded

# Помилка 2: треба видалити ініціалізацію атрибута (self.duration = 0), ми його не використовуємо,
# а також отримуємо помилку (не вистачає сеттера для призначення значення).

# Помилка 3: ми звертаємось до атрибута нашого екземпляра, а такого атрибута не існує,
# за умовою для цієї помилки було прибрано Name Mangling, та замінено на внутрішні атрибути.
# AttributeError: 'PartyPlaylist' object has no attribute '_PartyPlaylist__songs'. Did you mean: '_Playlist__songs'?
