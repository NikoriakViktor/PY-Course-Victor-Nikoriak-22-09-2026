def division():
    try:
        a = int(input("Enter value for a: "))
        b = int(input("Enter value for b: "))
        
        return (a ** 2) / b
    except ZeroDivisionError:
        print("The variable b cannot be 0!")
    except ValueError:
            print("The entered value has to be a number!")

print(division())