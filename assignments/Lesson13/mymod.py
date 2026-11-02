def count_lines(lines):
    lines_count = 1
    for i in lines:
        if "\n" in i:
            lines_count += 1
    
    return lines_count

def count_chars(lines):
    chars_count = 0
    for i in lines:
        if i.isalpha():
            chars_count += 1

    return chars_count
def test(lines):
    print(
        f"Text: \n{lines}\nLines count: {count_lines(lines)}\nChars count: {count_chars(lines)}\n"
    )