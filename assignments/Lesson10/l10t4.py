def stop_words(words: list):
    def stop_words(func):
        def wraper(name: str):
            text = func(name)

            for word in words:
                position = text.find(word)
                if position != -1:
                    text = text[:position] + "*" + text[(position + len(word)):]

            return text
        return wraper
    return stop_words

@stop_words(['pepsi', 'BMW'])
def create_slogan(name: str) -> str:
    return f"{name} drinks pepsi in his brand new BMW!"

#Строка 21 виведе Pepsi drinks * in his brand new *!. Тому що Pepsi з великої
#Строка 22 виведе * drinks * in his brand new *!
print(create_slogan("Pepsi"))
print(create_slogan("BMW"))