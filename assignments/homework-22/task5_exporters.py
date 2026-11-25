from abc import ABC, abstractmethod

__all__ = ['CsvExporter', 'MarkdownExporter']


def _join(cells, sep=','):
    return sep.join(str(item) for item in cells)


class Exporter(ABC):

    def export(self, rows):
        if not rows:
            raise ValueError("No value to export")

        columns = rows[0].keys()
        lines = [self._header(columns)]

        for row in rows:
            lines.append(self._row([row[key] for key in columns]))

        return _join(lines, sep='\n')

    @abstractmethod
    def _header(self, columns):
        ...

    @abstractmethod
    def _row(self, values):
        ...


class CsvExporter(Exporter):

    def _header(self, columns):
        return _join(columns)

    def _row(self, values):
        return _join(values)


class MarkdownExporter(Exporter):

    def _header(self, columns):
        return self._row(columns) + '\n' + self._row(['---'] * len(columns))

    def _row(self, values):
        return '|' + _join(values, sep='|') + '|'


class TsvExporter(Exporter):
    def _header(self, columns):
        return _join(columns, sep='\t')

    def _row(self, values):
        return _join(values, sep='\t')
