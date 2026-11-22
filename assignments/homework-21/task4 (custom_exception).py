# AI log: none

# режим роботи з файлом - 'a', якби ми використали 'w', то файл би не накопичував помилки, а кожен раз перезаписував їх

class CustomException(Exception):
    def __init__(self, msg):
        super().__init__(msg)

        with open('logs.txt', 'a', encoding='utf-8') as f:
            f.write(msg + '\n')


for error in ['Error 1', 'Error 2', 'Error 3']:
    try:
        raise CustomException(error)
    except CustomException as e:
        print(e)

# logs.txt:
# Error 1
# Error 2
# Error 3
