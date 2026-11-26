# Урок 30 — Підготовка PostgreSQL до заняття

Мета: запустити PostgreSQL локально через Docker і підключити Jupyter Notebook через `psycopg2`.

## 1. Встановіть та запустіть Docker

Встановіть [Docker Desktop](https://www.docker.com/products/docker-desktop/) і запустіть його. У терміналі PyCharm перевірте:

```bash
docker --version
docker compose version
docker info
```

Якщо Docker Desktop пропонує налаштувати WSL 2 на Windows, виконайте його інструкції та перезапустіть комп’ютер за потреби.


## 2. Запуск PostgreSQL у Docker

Існує два основні способи запуску контейнера:

- `docker run` — запуск безпосередньо через термінал.
- `docker compose` — запуск за допомогою конфігураційного YAML-файлу.

Оберіть один із двох способів. Виконувати обидва не потрібно.

### Варіант 1. Запуск через термінал (Docker Run)

Найпростіший спосіб запуску PostgreSQL:

```bash
docker run --name course-postgres -e POSTGRES_USER=student -e POSTGRES_PASSWORD=python2024 -e POSTGRES_DB=course_db -p 127.0.0.1:5432:5432 -v postgres_data:/var/lib/postgresql/data -d postgres:17
```

Ця команда працює у PowerShell, CMD, Bash та терміналі PyCharm.

Docker автоматично завантажить образ PostgreSQL,
створить контейнер та ініціалізує базу даних.

#### Розбір команди

| Параметр | Призначення |
|---|---|
| `docker run` | Створити та запустити контейнер |
| `--name course-postgres` | Ім'я контейнера |
| `-e POSTGRES_USER=student` | Ім'я користувача |
| `-e POSTGRES_PASSWORD=python2024` | Пароль користувача |
| `-e POSTGRES_DB=course_db` | Назва бази даних |
| `-p 127.0.0.1:5432:5432` | Прив'язка порту до локального комп'ютера |
| `-v postgres_data:/var/lib/postgresql/data` | Постійне зберігання даних |
| `-d` | Запуск у фоновому режимі |
| `postgres:17` | Образ PostgreSQL версії 17 |

#### Керування контейнером

```bash
# Перевірити запущені контейнери
docker ps

# Переглянути логи PostgreSQL
docker logs course-postgres

# Зупинити контейнер
docker stop course-postgres

# Запустити існуючий контейнер
docker start course-postgres

# Перезапустити контейнер
docker restart course-postgres
```

Команду `docker run` потрібно виконати лише один раз.
Для повторного запуску використовуйте `docker start`.

---

### Варіант 2. Запуск через Docker Compose

Docker Compose дозволяє описати конфігурацію контейнера
в окремому файлі замість написання довгих команд.

Перейдіть у папку проєкту.

Якщо `docker-compose.yml` уже існує, перевірте наявний
сервіс `postgres`, не замінюйте інші сервіси.

Якщо файлу немає, створіть його:

```yaml
services:
  postgres:
    image: postgres:17
    container_name: course-postgres
    restart: unless-stopped

    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Set POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:?Set POSTGRES_DB}

    ports:
      - "127.0.0.1:5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Створіть файл `.env` у тій самій папці:

```dotenv
POSTGRES_USER=student
POSTGRES_PASSWORD=python2024
POSTGRES_DB=course_db
```

Додайте `.env` до `.gitignore`.

Запустіть PostgreSQL:

```bash
docker compose up -d postgres
```

Перевірте статус:

```bash
docker compose ps
```

Перегляньте логи:

```bash
docker compose logs postgres
```

---

### Порівняння Docker Run та Docker Compose

| Docker Run | Docker Compose |
|---|---|
| `docker run` | `docker compose up` |
| `--name` | `container_name` |
| `-e` | `environment` |
| `-p` | `ports` |
| `-v` | `volumes` |
| `--restart` | `restart` |
| Образ в кінці команди | `image` |
| Конфігурація в команді | Конфігурація у YAML-файлі |
| Зручно для одного контейнера | Зручно для комплексних проєктів |

Обидва способи використовують Docker Engine для створення
та запуску контейнерів.

---

### Перевірка працездатності PostgreSQL

Незалежно від обраного способу запуску:

```bash
docker exec -it course-postgres psql -U student -d course_db
```

Виконайте SQL-запити:

```sql
SELECT version();
SELECT current_database();
SELECT current_user;
```

Для виходу з PostgreSQL:

```text
\q
```

### Параметри підключення

| Параметр | Значення |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | course_db |
| User | student |
| Password | python2024 |

Пароль використовується виключно для локального навчання.

---

### Типова помилка: POSTGRES_PASSWORD

Якщо при запуску контейнера виникла помилка:

```text
Error: Database is uninitialized and superuser
password is not specified.
```

Це означає, що PostgreSQL не отримав пароль адміністратора.

Для Docker Run необхідно передати:

```bash
-e POSTGRES_PASSWORD=python2024
```

Для Docker Compose необхідно перевірити секцію
`environment` та файл `.env`.

Якщо контейнер створено з неправильною конфігурацією,
його необхідно перестворити.

Для Docker Run:

```bash
docker stop course-postgres
docker rm course-postgres
```

Після цього повторіть правильну команду `docker run`.

Для Docker Compose:

```bash
docker compose up -d --force-recreate postgres
```

Не видаляйте volumes, якщо там зберігаються важливі дані.

Зверніть увагу: Docker Compose за замовчуванням створює
volume з префіксом назви проєкту, тому сховища двох
способів запуску не обов'язково будуть однаковими.

Змінні POSTGRES_USER, POSTGRES_PASSWORD та POSTGRES_DB
застосовуються під час першої ініціалізації порожнього
сховища. Вони не змінюють автоматично вже створену базу.

## 3. Запустіть сервер

У папці з Compose-файлом виконайте:

```bash
docker compose up -d postgres
docker compose ps
docker compose logs postgres
```

Дочекайтеся повідомлення `database system is ready to accept connections`. Для перевірки готовності:

```bash
docker exec course-postgres pg_isready -U student -d course_db
```

## 4. Перевірте підключення через psql

```bash
docker exec -it course-postgres psql -h 127.0.0.1 -U student -d course_db -W
```

Введіть пароль `python2024` (символи пароля не відображаються). Виконайте:

```sql
SELECT version();
SELECT current_database(), current_user;
```

Для виходу введіть `\q`.

## 5. Підключіть Python та Jupyter Notebook

У терміналі з активованим віртуальним середовищем:

```bash
python -m pip install psycopg2-binary
```

Або в комірці Jupyter, щоб встановити пакет у поточне ядро:

```python
%pip install psycopg2-binary
```

Виберіть локальне Python-ядро в PyCharm/Jupyter. Google Colab працює на віддаленому сервері, тому його `localhost` не є вашим комп’ютером.

```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="course_db",
    user="student",
    password="python2024",
    connect_timeout=5,
)
try:
    with conn.cursor() as cursor:
        cursor.execute("SELECT current_database(), current_user")
        print(cursor.fetchone())
finally:
    conn.close()
```

Очікуваний результат: `('course_db', 'student')`.

Тепер відкрийте `note_lesson_30_postgresql.ipynb` і виконуйте комірки послідовно. **Увага:** практична частина видаляє та створює навчальні таблиці заново (`DROP TABLE ... CASCADE`). Не запускайте її на робочій базі.

## 6. Типова помилка: POSTGRES_PASSWORD

```text
Error: Database is uninitialized and superuser password is not specified.
```

PostgreSQL не отримав непорожній пароль при ініціалізації. Перевірте файл `.env`, назви змінних, папку запуску та секцію `environment`. Виконайте:

```bash
docker compose config -q
docker compose up -d --force-recreate postgres
docker compose logs postgres
```

За потреби `docker compose config` показує підставлені значення, зокрема пароль — не публікуйте цей вивід. Не використовуйте `POSTGRES_HOST_AUTH_METHOD=trust` як виправлення.

| Помилка | Що перевірити |
|---|---|
| Connection refused | Docker запущено, контейнер готовий, порт правильний |
| Password authentication failed | Пароль існуючого користувача; зміна `.env` не змінює пароль у вже створеній БД |
| Database does not exist | Назва БД та чи була вона створена при першій ініціалізації |
| Port is already allocated | Інший PostgreSQL займає 5432; звільніть порт або змініть порт хоста і параметр Python |
| ModuleNotFoundError | Встановіть драйвер у тому самому Python-ядрі |
| Container name already in use | Перевірте `docker ps -a`, чи вже існує `course-postgres` |

## 7. Зупинка та повторний запуск

```bash
docker compose stop postgres
docker compose start postgres
```

Не використовуйте `docker compose down -v`, якщо хочете зберегти дані: ця команда видаляє іменовані volumes проєкту.

## Документація

- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Docker Compose](https://docs.docker.com/compose/)
- [psycopg2](https://www.psycopg.org/docs/)
