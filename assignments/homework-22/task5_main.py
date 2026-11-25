# AI log: розібрав із ментором архітектуру абстрактного класу Exporter та узгодження сигнатур абстрактних методів (_header, _row);
# виправив форматування MarkdownExporter і типи елементів у __all__.

from task5_exporters import *
from task5_exporters import TsvExporter

if __name__ == "__main__":
    rows = [
        {"name": "Ramen", "price": 1.5, "amount": 290},
        {"name": "T-Shirt", "price": 130, "amount": 9}
    ]

    print(dir(), '\n')  # ['CsvExporter', 'MarkdownExporter', 'TsvExporter', ...]

    f_csv = CsvExporter()
    f_markdown = MarkdownExporter()
    f_tsv = TsvExporter()

    print(f_csv.export(rows), '\n')
    print(f_markdown.export(rows), '\n')
    print(f_tsv.export(rows))

# в main.py будуть доступні лише CsvExporter, MarkdownExporter, бо ми їх прописали в __all__, а все інше не імпортується
# новий клас зайняв 6 рядків коду, мені не довелося переписувати допоміжну функцію _join та публічний метод базового класу export()
