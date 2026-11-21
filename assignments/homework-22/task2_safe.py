# AI log: none

class Safe:
    def __init__(self, code):
        self.__code = code

    def open(self, code):
        return code == self.__code


s = Safe("4821")

print(s.__dict__)  # {'_Safe__code': '4821'}
# print(s.__code) # AttributeError: 'Safe' object has no attribute '__code'
print(s._Safe__code)

# s.__code = "0000"
# print(s.open("4821"))  # поверне True, бо створиться окремий атрибут __code, а self.__code,
# бо він захований під іншим іменем(_Safe__code), тому залишиться 4821
