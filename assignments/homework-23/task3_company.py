# AI log: ментор допоміг налаштувати зв'язок між Boss і Worker:
# розібрали запуск сетера boss із __init__, плутанину з self у _workers і add_worker.

class Boss:
    def __init__(self, id_, name, company):
        self.id = id_
        self.name = name
        self.company = company
        self._workers = []

    # захист на читання атрибута id
    @property
    def id(self):
        return self._id

    # захист на присвоєння атрибута id
    @id.setter
    def id(self, value):
        if not isinstance(value, int):
            raise TypeError("Boss id must be an integer.")
        self._id = value

    # захист на читання атрибута workers
    @property
    def workers(self):
        return tuple(self._workers)

    # додаємо працівника
    def add_worker(self, worker):
        # якщо передане значення не є працівником, помилка
        if not isinstance(worker, Worker):
            raise TypeError("Worker must be a Worker instance.")
        worker.boss = self

    def __repr__(self):
        return f"Boss({self.id}, {self.name!r}, {self.company!r})"


class Worker:
    def __init__(self, id_, name, company, boss):
        self.id = id_
        self._boss = None
        self.boss = boss
        self.name = name
        self.company = company

    # захист на читання атрибута id
    @property
    def id(self):
        return self._id

    # захист на присвоєння атрибута id
    @id.setter
    def id(self, value):
        if not isinstance(value, int):
            raise TypeError("Worker id must be an integer.")
        self._id = value

    # захист на читання атрибута boss
    @property
    def boss(self):
        return self._boss

    # захист на присвоєння атрибута boss
    @boss.setter
    def boss(self, value):
        # якщо передане значення не є босом, помилка
        if not isinstance(value, Boss):
            raise TypeError("Boss must be a Boss instance.")

        # якщо бос залишився той самий, нічого не змінюємо
        if self._boss is value:
            return

        # якщо бос змінився прибираємо працівника зі списку в старого боса
        if self._boss is not None:
            self._boss._workers.remove(self)

        # присвоюємо нового боса
        self._boss = value
        self._boss._workers.append(self)

    def __repr__(self):
        return f"Worker({self.id}, {self.name!r}, {self.company!r}, boss={self.boss.name!r})"


anna = Boss(1, "Anna", "Beetroot")
oleh = Boss(2, "Oleh", "Beetroot")
ira = Worker(10, "Ira", "Beetroot", anna)
oleh.add_worker(ira)
print(anna.workers)  # ()
print(oleh.workers)  # (Worker(10, 'Ira', 'Beetroot', boss='Oleh'),)

try:
    ira.boss = "Oleh"  # TypeError
except TypeError as e:
    print(f"Error: {e}")

assert ira.boss is oleh
assert oleh.workers == (ira,)
assert anna.workers == ()

# повторюються гетери, сетери та перевірка типів;
# новим стала ініціалізація _boss = None до виклику сетера і двостороннє оновлення зв'язку між Boss та Worker.

# якби workers повертав список, його можна було б змінювати напряму (.append())
# в обхід перевірок — це зламало б зв'язок між Boss і Worker.
