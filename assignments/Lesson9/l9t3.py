#Складність функції crack(text_crypted) є O(n), тому що вхідний рядок скаладається з n літер, а цикл
#у функції decrypt(text_crypted, shift) має константну кількість ітерацій - 26
ALPHABET = "abcdefghijklmnopqrstuvwxyz"
text = "This a 1 test case of cryption and decyption functions"

def caesar(text, shift):
    result = ""
    for ch in text:
        if ch in ALPHABET:
            position = (ALPHABET.index(ch) + shift) % 26
            result += ALPHABET[position]
        elif ch.isupper():
            position = (ALPHABET.index(ch.lower()) + shift) % 26
            result += ALPHABET[position].upper()
        else:
            result += ch
    return result

def decrypt(text_crypted, shift):
    if not isinstance(shift, int):
        print("Error. Shift must be a whole number")
        return

    result = ""
    for ch in text_crypted:
        if ch in ALPHABET:
            position = ALPHABET.index(ch) - shift
            result += ALPHABET[position]
        elif ch.isupper():
            position = ALPHABET.index(ch.lower()) - shift
            result += ALPHABET[position].upper()
        else:
            result += ch
    return result

def crack(text_crypted):
    shift = 0

    while shift < 26:
        print(f"Shift {shift}: {decrypt(text_crypted, shift)}")
        shift += 1

crypted = caesar(text, 3)
#decrypted = decrypt(crypted, 3)

crack(crypted)

#print(f"Original: {text}\nCrypted: {crypted}\nDecrypted: {decrypted}")