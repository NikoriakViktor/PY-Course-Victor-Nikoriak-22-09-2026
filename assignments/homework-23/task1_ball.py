# AI log: поцікавився різницею між __str__ і __repr__, та як краще їх оформляти.

class Ball:
    def __init__(self, colour):
        self.colour = colour

    def __repr__(self):
        return f"{self.__class__.__name__}('{self.colour}')"

    def __str__(self):
        return f"[{self.__class__.__name__}] colour - {self.colour}"


b = Ball("red")
print(b)  # виведе [Ball] colour - red
print(repr(b))  # виведе Ball('red')

print([b, Ball("blue")])  # виведе [Ball('red'), Ball('blue')]
print(f"I have {b}")  # виведе "I have [Ball] colour - red"

# python -i task1_ball.py
# [Ball] colour - red
# Ball('red')
# [Ball('red'), Ball('blue')]
# I have [Ball] colour - red
# >>> b
# Ball('red')
