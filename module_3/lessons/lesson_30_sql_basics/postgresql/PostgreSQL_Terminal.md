
# PostgreSQL — робота з базою даних через термінал

## 1. Основні поняття

Для роботи з PostgreSQL не обов'язково використовувати графічні
інтерфейси, такі як DBeaver або pgAdmin.

Усі операції можна виконувати через термінал.

| Компонент | Призначення |
|---|---|
| Docker | Середовище запуску контейнерів |
| PostgreSQL | Сервер управління базами даних |
| Bash | Командна оболонка Linux |
| PowerShell | Командна оболонка Windows |
| psql | Термінальний клієнт PostgreSQL |
| SQL | Мова взаємодії з базою даних |
| TCP/IP | Мережевий протокол передачі даних |
| 5432 | Стандартний порт PostgreSQL |

Загальна схема взаємодії:

```text
Користувач
    |
    v
Термінал Windows / Linux
    |
    v
Docker Container
    |
    v
psql (клієнт PostgreSQL)
    |
    v
PostgreSQL Server
    |
    v
Database
    |
    v
Schema
    |
    v
Tables
    |
    v
Rows / Columns
```

---

## 2. Запуск PostgreSQL через Docker

Переконайтеся, що Docker Desktop запущено.

Створіть та запустіть контейнер:

```bash
docker run --name course-postgres -e POSTGRES_USER=student -e POSTGRES_PASSWORD=python2024 -e POSTGRES_DB=course_db -p 127.0.0.1:5432:5432 -v postgres_data:/var/lib/postgresql/data -d postgres:17
```

Перевірте запущені контейнери:

```bash
docker ps
```

Перегляньте логи:

```bash
docker logs course-postgres
```

Якщо контейнер уже був створений, повторно виконувати
docker run не потрібно.

Для повторного запуску:

```bash
docker start course-postgres
```

Для зупинки:

```bash
docker stop course-postgres
```

---

## 3. Параметри підключення

| Параметр | Значення |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | course_db |
| User | student |
| Password | python2024 |
| Container | course-postgres |
| PostgreSQL version | 17 |

Ці параметри використовуються виключно для локального навчання.

---

## 4. Підключення до PostgreSQL

### Спосіб 1. Через Bash усередині Docker-контейнера

Виконайте в терміналі Windows:

```bash
docker exec -it course-postgres bash
```

Після цього ви опинитеся всередині Linux-контейнера:

```text
root@35a55bd7c720:/#
```

Це Bash — командна оболонка Linux.

Тут можна виконувати команди Linux:

```bash
ls
pwd
whoami
```

Але не можна безпосередньо виконувати SQL-запити.

Для підключення до PostgreSQL виконайте:

```bash
psql -U student -d course_db
```

Параметри:

| Параметр | Значення |
|---|---|
| psql | Клієнт PostgreSQL |
| -U | Username — ім'я користувача |
| -d | Database — назва бази даних |
| -h | Host — адреса сервера |
| -p | Port — порт сервера |
| -W | Запит пароля |
| -c | Виконання окремої команди |
| -f | Виконання SQL-файлу |

Після підключення:

```text
psql (17.x)
Type "help" for help.

course_db=#
```

Тепер можна виконувати SQL-запити.

### Спосіб 2. Пряме підключення через Docker

Заходити в Bash контейнера не обов'язково.

Можна одразу запустити psql:

```bash
docker exec -it course-postgres psql -U student -d course_db
```

### Спосіб 3. Через локально встановлений psql

Якщо клієнт psql встановлений на вашому комп'ютері:

```bash
psql -h localhost -p 5432 -U student -d course_db -W
```

Введіть пароль:

```text
python2024
```

У цьому випадку клієнт підключається до сервера через мережу.

---

## 5. Як розрізняти термінали

### PowerShell

```text
PS C:\Users\student>
```

Команди:

```powershell
docker ps
docker images
docker exec
```

### Bash усередині контейнера

```text
root@35a55bd7c720:/#
```

Команди:

```bash
ls
pwd
whoami
psql -U student -d course_db
```

### PostgreSQL — клієнт psql

```text
course_db=#
```

Команди:

```sql
SELECT version();
SELECT current_database();
SELECT current_user;
```

Якщо ви спробуєте виконати SQL у Bash:

```bash
SELECT version();
```

Отримаєте помилку:

```text
bash: syntax error near unexpected token '('
```

Причина: Bash не є SQL-інтерпретатором.

Спочатку необхідно запустити клієнт psql.

---

## 6. SQL-команди та метакоманди psql

У клієнті psql існують два типи команд.

### SQL-команди

Передаються безпосередньо серверу PostgreSQL.

Наприклад:

```sql
SELECT version();
CREATE TABLE students (id INTEGER);
SELECT * FROM students;
```

SQL-команди зазвичай завершуються крапкою з комою (;).

### Метакоманди psql

Обробляються самим клієнтом psql.

Починаються зі зворотного слеша.

```text
\l
\dt
\du
\q
```

Метакоманди не потребують крапки з комою.

| SQL-команди | Метакоманди psql |
|---|---|
| Виконує сервер | Виконує клієнт |
| SELECT | \dt |
| CREATE TABLE | \d |
| INSERT | \l |
| UPDATE | \du |
| DELETE | \q |
| Працюють через Python | Призначені для psql |

---

## 7. Найважливіші команди psql

### Допомога

| Команда | Призначення |
|---|---|
| `\?` | Допомога щодо команд psql |
| `\h` | Список SQL-команд |
| `\h SELECT` | Документація SELECT |
| `\h CREATE TABLE` | Документація CREATE TABLE |
| `\conninfo` | Інформація про поточне підключення |
| `\q` | Вийти з psql |

Наприклад:

```text
\h CREATE TABLE
```

PostgreSQL покаже синтаксис створення таблиці.

### Навігація та дослідження бази даних

| Команда | Призначення |
|---|---|
| `\l` | Список баз даних |
| `\l+` | Детальна інформація про бази |
| `\c course_db` | Підключитися до бази course_db |
| `\dn` | Список схем |
| `\dn+` | Детальна інформація про схеми |
| `\dt` | Список видимих таблиць |
| `\dt *.*` | Таблиці всіх схем |
| `\dt public.*` | Таблиці схеми public |
| `\dt+` | Детальна інформація про таблиці |
| `\d students` | Структура таблиці students |
| `\d+ students` | Детальна структура таблиці |
| `\di` | Список індексів |
| `\dv` | Список представлень (Views) |
| `\dm` | Матеріалізовані представлення |
| `\ds` | Послідовності (Sequences) |
| `\df` | Функції |
| `\dp` | Права доступу |
| `\du` | Користувачі та ролі |
| `\dx` | Встановлені розширення |

### Керування виведенням

| Команда | Призначення |
|---|---|
| `\x` | Вертикальний формат результатів |
| `\x auto` | Автоматичний вибір формату |
| `\timing` | Увімкнути або вимкнути вимірювання часу |
| `\pset pager off` | Вимкнути посторінкове виведення |
| `\pset pager on` | Увімкнути посторінкове виведення |
| `\o result.txt` | Записувати результати у файл |
| `\o` | Повернути виведення в термінал |

### Робота із SQL-запитом

| Команда | Призначення |
|---|---|
| `\p` | Показати поточний буфер SQL-запиту |
| `\r` | Очистити буфер SQL-запиту |
| `\g` | Виконати SQL-запит |
| `\e` | Відкрити SQL-запит у текстовому редакторі |
| `\i script.sql` | Виконати SQL-файл |
| `\!` | Запустити командну оболонку |
| `\! ls` | Виконати команду Linux |

---

## 8. Інформація про PostgreSQL

Перевірити версію сервера:

```sql
SELECT version();
```

Перевірити поточну базу даних:

```sql
SELECT current_database();
```

Перевірити поточного користувача:

```sql
SELECT current_user;
```

Перевірити поточну схему:

```sql
SELECT current_schema();
```

Поточний час сервера:

```sql
SELECT NOW();
```

Перевірити порт:

```sql
SHOW port;
```

Перевірити шлях до каталогу даних:

```sql
SHOW data_directory;
```

Перевірити шлях до конфігураційного файлу:

```sql
SHOW config_file;
```

Переглянути налаштування PostgreSQL:

```sql
SHOW ALL;
```

Перевірити інформацію про підключення:

```text
\conninfo
```

---

## 9. Робота з базами даних

Переглянути всі бази даних:

```text
\l
```

Створити нову базу:

```sql
CREATE DATABASE shop_db;
```

Підключитися до неї:

```text
\c shop_db
```

Перевірити поточну базу:

```sql
SELECT current_database();
```

Повернутися до навчальної бази:

```text
\c course_db
```

Перейменувати базу:

```sql
ALTER DATABASE shop_db RENAME TO store_db;
```

Видалити базу:

```sql
DROP DATABASE store_db;
```

Увага! DROP DATABASE видаляє всю базу даних.

Не можна видалити базу, до якої ви зараз підключені.

---

## 10. Робота зі схемами (Schemas)

Schema — це логічний простір імен усередині бази даних,
який дозволяє групувати таблиці та інші об'єкти.

```text
PostgreSQL Server
    |
    +-- course_db
    |      |
    |      +-- public
    |      |      +-- students
    |      |      +-- courses
    |      |
    |      +-- shop
    |             +-- products
    |             +-- orders
    |
    +-- another_db
```

Переглянути схеми:

```text
\dn
```

Створити схему:

```sql
CREATE SCHEMA IF NOT EXISTS shop;
```

Створити таблицю у відповідній схемі:

```sql
CREATE TABLE shop.products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10, 2)
);
```

Звернення до таблиці:

```sql
SELECT * FROM shop.products;
```

Повна назва таблиці:

```text
schema_name.table_name
```

Перевірити порядок пошуку схем:

```sql
SHOW search_path;
```

Встановити порядок пошуку:

```sql
SET search_path TO shop, public;
```

Повернути налаштування за замовчуванням:

```sql
RESET search_path;
```

Переглянути таблиці конкретної схеми:

```text
\dt shop.*
```

Видалити таблицю та порожню схему:

```sql
DROP TABLE shop.products;
DROP SCHEMA shop;
```

---

## 11. Створення таблиць

```sql
CREATE TABLE IF NOT EXISTS students (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 0),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Типи даних

| Тип | Призначення |
|---|---|
| INTEGER | Ціле число |
| BIGINT | Велике ціле число |
| NUMERIC | Число з точною десятковою арифметикою |
| REAL | Число з плаваючою точкою |
| VARCHAR(n) | Рядок обмеженої довжини |
| TEXT | Текст |
| BOOLEAN | TRUE або FALSE |
| DATE | Дата |
| TIME | Час |
| TIMESTAMP | Дата та час |
| TIMESTAMPTZ | Дата та час з урахуванням часового поясу |
| JSONB | JSON-дані |
| UUID | Універсальний унікальний ідентифікатор |
| BYTEA | Бінарні дані |

### Обмеження (Constraints)

| Обмеження | Призначення |
|---|---|
| PRIMARY KEY | Унікальний ідентифікатор рядка |
| FOREIGN KEY | Посилання на іншу таблицю |
| NOT NULL | Забороняє порожнє значення NULL |
| UNIQUE | Забороняє дублікати значень |
| CHECK | Перевіряє умову |
| DEFAULT | Встановлює значення за замовчуванням |
| IDENTITY | Автоматично генерує числові ідентифікатори |

Переглянути таблиці:

```text
\dt
```

Переглянути структуру:

```text
\d students
```

Детальна інформація:

```text
\d+ students
```

---

## 12. CRUD — основні операції з даними

CRUD — чотири базові операції з даними.

| Операція | SQL-команда | Призначення |
|---|---|---|
| Create | INSERT | Додавання |
| Read | SELECT | Читання |
| Update | UPDATE | Оновлення |
| Delete | DELETE | Видалення |

### CREATE — додавання даних

```sql
INSERT INTO students (name, age, email)
VALUES
    ('Anna', 25, 'anna@example.com'),
    ('Ivan', 22, 'ivan@example.com'),
    ('Maria', 27, 'maria@example.com');
```

Додавання запису з поверненням ID:

```sql
INSERT INTO students (name, age, email)
VALUES ('Olena', 24, 'olena@example.com')
RETURNING id;
```

### READ — читання даних

Усі записи:

```sql
SELECT * FROM students;
```

Конкретні колонки:

```sql
SELECT name, age FROM students;
```

Фільтрація:

```sql
SELECT * FROM students
WHERE age >= 25;
```

Пошук за іменем:

```sql
SELECT * FROM students
WHERE name = 'Anna';
```

Пошук без урахування регістру:

```sql
SELECT * FROM students
WHERE name ILIKE 'a%';
```

Сортування:

```sql
SELECT * FROM students
ORDER BY age DESC;
```

Обмеження кількості записів:

```sql
SELECT * FROM students
ORDER BY id
LIMIT 2;
```

Пропустити перші два записи:

```sql
SELECT * FROM students
ORDER BY id
LIMIT 2 OFFSET 2;
```

Унікальні значення:

```sql
SELECT DISTINCT age
FROM students;
```

### UPDATE — оновлення даних

```sql
UPDATE students
SET age = 26
WHERE name = 'Anna';
```

Оновлення кількох полів:

```sql
UPDATE students
SET age = 23,
    name = 'Ivan Petrenko'
WHERE email = 'ivan@example.com';
```

Повернення оновленого запису:

```sql
UPDATE students
SET age = 28
WHERE email = 'maria@example.com'
RETURNING *;
```

### DELETE — видалення даних

```sql
DELETE FROM students
WHERE email = 'olena@example.com';
```

Видалення з поверненням запису:

```sql
DELETE FROM students
WHERE email = 'maria@example.com'
RETURNING *;
```

Увага!

UPDATE або DELETE без WHERE застосовується
до всіх рядків таблиці.

---

## 13. Агрегація даних

Порахувати кількість студентів:

```sql
SELECT COUNT(*) FROM students;
```

Середній вік:

```sql
SELECT AVG(age) FROM students;
```

Мінімальний та максимальний вік:

```sql
SELECT MIN(age), MAX(age)
FROM students;
```

Групування:

```sql
SELECT age, COUNT(*) AS total
FROM students
GROUP BY age;
```

Фільтрація після групування:

```sql
SELECT age, COUNT(*) AS total
FROM students
GROUP BY age
HAVING COUNT(*) > 1;
```

Основні агрегатні функції:

| Функція | Призначення |
|---|---|
| COUNT() | Кількість |
| SUM() | Сума |
| AVG() | Середнє значення |
| MIN() | Мінімум |
| MAX() | Максимум |
| STDDEV() | Стандартне відхилення |
| VARIANCE() | Дисперсія |

---

## 14. Зміна структури таблиці

Додавання колонки:

```sql
ALTER TABLE students
ADD COLUMN phone VARCHAR(20);
```

Перейменування колонки:

```sql
ALTER TABLE students
RENAME COLUMN phone TO phone_number;
```

Зміна типу даних:

```sql
ALTER TABLE students
ALTER COLUMN phone_number TYPE TEXT;
```

Встановлення значення за замовчуванням:

```sql
ALTER TABLE students
ALTER COLUMN age SET DEFAULT 18;
```

Видалення колонки:

```sql
ALTER TABLE students
DROP COLUMN phone_number;
```

Перейменування таблиці:

```sql
ALTER TABLE students
RENAME TO course_students;
```

Повернення початкової назви:

```sql
ALTER TABLE course_students
RENAME TO students;
```

---

## 15. Зв'язки між таблицями

Створимо таблицю курсів:

```sql
CREATE TABLE courses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(100) NOT NULL
);
```

Додамо курси:

```sql
INSERT INTO courses (title)
VALUES ('Python'), ('SQL'), ('Django');
```

Створимо проміжну таблицю:

```sql
CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    PRIMARY KEY (student_id, course_id)
);
```

Структура зв'язків:

```text
students
+----+------+
| id | name |
+----+------+
    |
    | 1:N
    v
enrollments
+------------+-----------+
| student_id | course_id |
+------------+-----------+
                     ^
                     | N:1
                     |
courses
+----+--------+
| id | title  |
+----+--------+
```

Запишемо на Python усіх наявних студентів:

```sql
INSERT INTO enrollments (student_id, course_id)
SELECT students.id, courses.id
FROM students
CROSS JOIN courses
WHERE courses.title = 'Python'
ON CONFLICT DO NOTHING;
```

Об'єднання таблиць:

```sql
SELECT
    students.name,
    courses.title
FROM enrollments
JOIN students
    ON students.id = enrollments.student_id
JOIN courses
    ON courses.id = enrollments.course_id;
```

Основні типи JOIN:

| Тип | Призначення |
|---|---|
| INNER JOIN | Записи, які мають відповідність |
| LEFT JOIN | Усі записи лівої таблиці |
| RIGHT JOIN | Усі записи правої таблиці |
| FULL JOIN | Усі записи обох таблиць |
| CROSS JOIN | Усі можливі комбінації |

---

## 16. Індекси

Індекс — додаткова структура даних, яка може
пришвидшувати пошук записів.

Створити індекс:

```sql
CREATE INDEX idx_students_age
ON students(age);
```

Переглянути індекси:

```text
\di
```

Детальна інформація:

```text
\di+
```

Видалити індекс:

```sql
DROP INDEX idx_students_age;
```

Індекси можуть пришвидшувати читання,
але потребують додаткового місця
та ресурсів під час зміни даних.

---

## 17. Аналіз SQL-запитів

EXPLAIN показує запланований спосіб виконання запиту.

```sql
EXPLAIN
SELECT * FROM students
WHERE age = 25;
```

EXPLAIN ANALYZE виконує запит
та показує фактичні показники виконання.

```sql
EXPLAIN ANALYZE
SELECT * FROM students
WHERE age = 25;
```

Додаткова інформація про буфери:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM students
WHERE age = 25;
```

Основні поняття:

| Термін | Значення |
|---|---|
| Sequential Scan | Послідовне читання таблиці |
| Index Scan | Читання з використанням індексу |
| Planning Time | Час побудови плану |
| Execution Time | Час виконання |
| Cost | Оціночна вартість виконання |
| Rows | Кількість рядків |
| Buffers | Використання блоків даних |

На маленьких таблицях PostgreSQL може обрати
Sequential Scan навіть за наявності індексу.

Увімкнути вимірювання часу в psql:

```text
\timing on
```

Виконати запит:

```sql
SELECT * FROM students;
```

Вимкнути вимірювання:

```text
\timing off
```

Увага: EXPLAIN ANALYZE реально виконує запит.
Для UPDATE, INSERT або DELETE він може змінити дані.

---

## 18. Транзакції

Транзакція — група операцій, які виконуються
як одна логічна одиниця роботи.

Основні команди:

| Команда | Призначення |
|---|---|
| BEGIN | Початок транзакції |
| COMMIT | Підтвердження змін |
| ROLLBACK | Скасування змін |
| SAVEPOINT | Проміжна точка збереження |
| ROLLBACK TO | Повернення до точки збереження |

### Приклад COMMIT

```sql
BEGIN;

INSERT INTO students (name, age, email)
VALUES ('Peter', 30, 'peter@example.com');

COMMIT;
```

### Приклад ROLLBACK

```sql
BEGIN;

UPDATE students
SET age = 100;

SELECT * FROM students;

ROLLBACK;
```

Після ROLLBACK зміни будуть скасовані.

Перевірте:

```sql
SELECT * FROM students;
```

### Приклад SAVEPOINT

```sql
BEGIN;

UPDATE students
SET age = 31
WHERE email = 'peter@example.com';

SAVEPOINT step_one;

UPDATE students
SET age = 200;

ROLLBACK TO step_one;

COMMIT;
```

У результаті перша зміна залишиться,
а друга буде скасована.

---

## 19. Користувачі, ролі та права доступу

У PostgreSQL користувачі реалізовані через ролі (Roles).

Переглянути ролі:

```text
\du
```

Створити роль з можливістю підключення:

```sql
CREATE ROLE developer LOGIN;
```

Встановити пароль інтерактивно:

```text
\password developer
```

Дозволити підключення до бази:

```sql
GRANT CONNECT ON DATABASE course_db TO developer;
```

Дозволити доступ до схеми:

```sql
GRANT USAGE ON SCHEMA public TO developer;
```

Дозволити читання таблиці:

```sql
GRANT SELECT ON students TO developer;
```

Дозволити зміну даних:

```sql
GRANT INSERT, UPDATE, DELETE
ON students TO developer;
```

Переглянути права доступу:

```text
\dp students
```

Відкликати права:

```sql
REVOKE INSERT, UPDATE, DELETE
ON students FROM developer;
```

Перевірити поточного користувача:

```sql
SELECT current_user;
```

Навчальний користувач student, створений через
POSTGRES_USER, має права суперкористувача.

У реальних застосунках не рекомендується
використовувати суперкористувача для звичайної роботи.

---

## 20. Робота з представленнями (Views)

View — збережений SQL-запит, до якого можна
звертатися подібно до таблиці.

```sql
CREATE VIEW adult_students AS
SELECT id, name, age
FROM students
WHERE age >= 18;
```

Отримати дані:

```sql
SELECT * FROM adult_students;
```

Переглянути представлення:

```text
\dv
```

Переглянути структуру:

```text
\d adult_students
```

Видалити представлення:

```sql
DROP VIEW adult_students;
```

---

## 21. Робота з розширеннями PostgreSQL

Розширення додають нову функціональність до PostgreSQL.

Переглянути встановлені розширення:

```text
\dx
```

Переглянути доступні розширення:

```sql
SELECT name, default_version, installed_version
FROM pg_available_extensions
ORDER BY name;
```

Встановити розширення для пошуку за подібністю:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Приклад:

```sql
SELECT similarity('Python', 'Pyton');
```

Популярні розширення:

| Розширення | Призначення |
|---|---|
| pg_trgm | Пошук за подібністю тексту |
| pgcrypto | Криптографічні функції |
| PostGIS | Геопросторові дані |
| pgvector | Векторний пошук та AI embeddings |
| TimescaleDB | Часові ряди |

Деякі розширення необхідно додатково встановити
на сервер або використати спеціальний Docker-образ.

---

## 22. Моніторинг PostgreSQL

Переглянути активні підключення:

```sql
SELECT
    pid,
    usename,
    datname,
    state,
    query
FROM pg_stat_activity;
```

Переглянути активні запити:

```sql
SELECT
    pid,
    usename,
    query,
    NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active';
```

Переглянути розмір поточної бази:

```sql
SELECT pg_size_pretty(
    pg_database_size(current_database())
);
```

Переглянути розмір таблиці разом з індексами:

```sql
SELECT pg_size_pretty(
    pg_total_relation_size('students')
);
```

Статистика таблиць:

```sql
SELECT
    relname,
    n_live_tup,
    n_dead_tup,
    seq_scan,
    idx_scan
FROM pg_stat_user_tables;
```

Ці команди використовуються для діагностики,
моніторингу та оптимізації бази даних.

---

## 23. Робота з SQL-файлами

Створіть на комп'ютері файл script.sql:

```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10, 2)
);

INSERT INTO products (name, price)
VALUES ('Laptop', 25000);

SELECT * FROM products;
```

Скопіюйте файл у контейнер:

```bash
docker cp script.sql course-postgres:/tmp/script.sql
```

Виконайте його через термінал:

```bash
docker exec -it course-postgres psql -U student -d course_db -v ON_ERROR_STOP=1 -f /tmp/script.sql
```

Або всередині клієнта psql:

```text
\i /tmp/script.sql
```

Цей підхід використовується для:

- створення структури бази;
- SQL-скриптів;
- міграцій;
- наповнення тестовими даними;
- автоматизації;
- підготовки навчального середовища.

---

## 24. Експорт та імпорт CSV

Експорт таблиці через psql:

```text
\copy students TO '/tmp/students.csv' WITH (FORMAT CSV, HEADER TRUE)
```

Якщо psql запущено всередині контейнера,
файл створиться всередині контейнера.

Для копіювання файлу на комп'ютер:

```bash
docker cp course-postgres:/tmp/students.csv students.csv
```

Імпорт CSV:

```text
\copy students(name, age, email) FROM '/tmp/import.csv' WITH (FORMAT CSV, HEADER TRUE)
```

Перед імпортом файл import.csv необхідно
скопіювати в контейнер.

Його колонки повинні відповідати зазначеним
колонкам таблиці.

### COPY та \copy

| COPY | \copy |
|---|---|
| SQL-команда | Метакоманда psql |
| Працює з боку сервера | Працює з боку клієнта |
| Використовує файлову систему сервера | Використовує файлову систему клієнта |
| Потребує відповідних серверних прав | Потребує доступу клієнта до файлу |

---

## 25. Резервне копіювання (Backup)

Створити SQL-дамп бази даних:

```bash
docker exec course-postgres pg_dump -U student -d course_db -f /tmp/backup.sql
```

Скопіювати резервну копію на комп'ютер:

```bash
docker cp course-postgres:/tmp/backup.sql backup.sql
```

Створити окрему базу для відновлення:

```bash
docker exec course-postgres createdb -U student course_db_restored
```

Відновити дані в новій базі:

```bash
docker exec course-postgres psql -U student -d course_db_restored -v ON_ERROR_STOP=1 -f /tmp/backup.sql
```

Перевірити відновлену базу:

```bash
docker exec -it course-postgres psql -U student -d course_db_restored
```

Виконати:

```text
\dt
```

Основні утиліти PostgreSQL:

| Утиліта | Призначення |
|---|---|
| psql | Робота з базою через термінал |
| pg_dump | Резервна копія окремої бази |
| pg_dumpall | Резервна копія всіх баз та глобальних об'єктів |
| pg_restore | Відновлення архівного формату дампа |
| createdb | Створення бази |
| dropdb | Видалення бази |
| createuser | Створення ролі |
| pg_isready | Перевірка доступності сервера |

---

## 26. Виконання SQL без входу в psql

Не обов'язково відкривати інтерактивний клієнт.

Можна виконати один SQL-запит:

```bash
docker exec -it course-postgres psql -U student -d course_db -c "SELECT version();"
```

Отримати список таблиць:

```bash
docker exec -it course-postgres psql -U student -d course_db -c "\dt"
```

Отримати дані:

```bash
docker exec -it course-postgres psql -U student -d course_db -c "SELECT * FROM students;"
```

Це зручно для автоматизації та скриптів.

---

## 27. Як зрозуміти стан термінала psql

| Запрошення | Значення |
|---|---|
| course_db=# | Очікування команди від суперкористувача |
| course_db=> | Очікування команди від звичайного користувача |
| course_db-# | SQL-команда ще не завершена |
| course_db'# | Не закрито одинарні лапки |
| course_db"# | Не закрито подвійні лапки |
| course_db(# | Не закрито круглу дужку |
| course_db=*# | Відкрита транзакція |
| course_db=!# | Транзакція перебуває у стані помилки |

Наприклад:

```text
course_db=# SELECT *
course_db-# FROM students
course_db-# ;
```

PostgreSQL очікує завершення SQL-команди.

Для очищення незавершеного запиту:

```text
\r
```

Якщо ви перебуваєте всередині незакритих лапок,
або потрібно перервати введення:

```text
Ctrl + C
```

Якщо транзакція перебуває у стані помилки:

```sql
ROLLBACK;
```

Якщо результат відкрився в посторінковому
переглядачі та внизу з'явилося (END),
натисніть клавішу q.

---

## 28. Гарячі клавіші

| Комбінація | Призначення |
|---|---|
| Стрілка вгору | Попередня команда |
| Стрілка вниз | Наступна команда |
| Tab | Автодоповнення |
| Ctrl + C | Переривання запиту або введення |
| Ctrl + D | Вихід з інтерактивного клієнта при порожньому вводі |
| Ctrl + R | Пошук в історії команд |
| Ctrl + L | Очищення екрана |
| Ctrl + A | Перейти на початок рядка |
| Ctrl + E | Перейти в кінець рядка |
| q | Вихід з посторінкового переглядача |

Доступність деяких комбінацій залежить
від термінала та підтримки Readline.

---

## 29. Видалення даних: DELETE, TRUNCATE, DROP

| Команда | Дані | Структура таблиці |
|---|---|---|
| DELETE | Видаляє вибрані або всі рядки | Залишається |
| TRUNCATE | Видаляє всі рядки | Залишається |
| DROP TABLE | Видаляє всі дані | Видаляється |
| DROP DATABASE | Видаляє всю базу | Видаляється |

Для демонстрації створимо окрему таблицю:

```sql
CREATE TABLE temp_students AS
SELECT * FROM students;
```

Видалити конкретні записи:

```sql
DELETE FROM temp_students
WHERE age < 25;
```

Очистити таблицю:

```sql
TRUNCATE TABLE temp_students;
```

Видалити таблицю:

```sql
DROP TABLE temp_students;
```

Ці команди необхідно використовувати обережно.

---

## 30. Вихід із PostgreSQL

Вийти з клієнта psql:

```text
\q
```

Якщо ви заходили через Bash, після виходу з psql
ви повернетеся до Linux-контейнера.

Вийти з контейнера:

```bash
exit
```

Зупинити PostgreSQL:

```bash
docker stop course-postgres
```

Повторно запустити:

```bash
docker start course-postgres
```

Дані збережуться у Docker Volume.

---

## 31. Шпаргалка: найважливіші команди

### Docker

| Команда | Призначення |
|---|---|
| docker ps | Запущені контейнери |
| docker ps -a | Усі контейнери |
| docker images | Образи |
| docker start | Запуск контейнера |
| docker stop | Зупинка контейнера |
| docker restart | Перезапуск |
| docker logs | Логи |
| docker exec | Виконання команди в контейнері |
| docker cp | Копіювання файлів |
| docker inspect | Інформація про контейнер |
| docker volume ls | Список сховищ |
| docker stats | Використання ресурсів |

### PostgreSQL — psql

| Команда | Призначення |
|---|---|
| `\?` | Допомога |
| `\h` | SQL-документація |
| `\l` | Бази даних |
| `\c` | Змінити базу |
| `\dn` | Схеми |
| `\dt` | Таблиці |
| `\d` | Структура об'єкта |
| `\di` | Індекси |
| `\du` | Ролі |
| `\dv` | Views |
| `\dx` | Розширення |
| `\conninfo` | Інформація про підключення |
| `\timing` | Час виконання |
| `\x` | Вертикальне виведення |
| `\i` | Виконати SQL-файл |
| `\copy` | Імпорт та експорт |
| `\r` | Очистити SQL-буфер |
| `\q` | Вихід |

### SQL

| Команда | Призначення |
|---|---|
| SELECT | Отримати дані |
| INSERT | Додати дані |
| UPDATE | Оновити дані |
| DELETE | Видалити записи |
| CREATE | Створити об'єкт |
| ALTER | Змінити структуру |
| DROP | Видалити об'єкт |
| TRUNCATE | Очистити таблицю |
| JOIN | Об'єднати таблиці |
| GRANT | Надати права |
| REVOKE | Відкликати права |
| BEGIN | Почати транзакцію |
| COMMIT | Підтвердити зміни |
| ROLLBACK | Скасувати зміни |
| EXPLAIN | План виконання запиту |
| ANALYZE | Оновити статистику |
| VACUUM | Обслуговування таблиць |
| SHOW | Переглянути налаштування |
| SET | Змінити налаштування сеансу |

---

## 32. Практичне завдання

1. Запустіть PostgreSQL через Docker.
2. Підключіться до бази через psql.
3. Перевірте версію PostgreSQL.
4. Створіть базу library_db.
5. Підключіться до library_db.
6. Створіть схему library.
7. Створіть таблицю books.
8. Додайте щонайменше 10 книг.
9. Виведіть усі книги.
10. Відфільтруйте книги за роком видання.
11. Відсортуйте книги за назвою.
12. Оновіть інформацію про одну книгу.
13. Створіть індекс для року видання.
14. Перевірте запит через EXPLAIN ANALYZE.
15. Видаліть один запис усередині транзакції.
16. Скасуйте видалення через ROLLBACK.
17. Експортуйте таблицю у CSV.
18. Створіть резервну копію бази.
19. Вийдіть із psql.

Усі завдання необхідно виконати виключно
через термінал, без графічних інтерфейсів.

---

## 33. Офіційна документація

- PostgreSQL:
  https://www.postgresql.org/docs/current/

- PostgreSQL psql:
  https://www.postgresql.org/docs/current/app-psql.html

- SQL Commands:
  https://www.postgresql.org/docs/current/sql-commands.html

- PostgreSQL Data Types:
  https://www.postgresql.org/docs/current/datatype.html

- PostgreSQL Docker Image:
  https://hub.docker.com/_/postgres

- Docker CLI:
  https://docs.docker.com/reference/cli/docker/

---

Python Backend Development | PostgreSQL | Lesson 30
