import random
import sys

# randint це атрибут модуля random. Так як ми створили власний модуль random
# виник конфлікт двох модулів random. В даному випадку підтягнувся random локальний
# який не містить randint
# Для виправлення достатньо перейменувати кастомний random в custom_random
random.randint(1, 6)