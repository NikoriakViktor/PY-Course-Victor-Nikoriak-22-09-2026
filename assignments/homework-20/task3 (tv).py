# AI log: попросив перевірити логіку роботи методів; за підказками виправив зсув індексів, логіку переходу по колу та додав перевірку на нуль у методі exists.

# next_channel() якщо це найперша команда, поверне "Discovery"
# turn_channel(0) функція перемикається на обраний канал, оскільки каналу 0 немає, поверне останній канал "TV1000"

class TVController:
    def __init__(self, channels):
        self.channels = channels
        self.channel_number = 1

    def first_channel(self):
        self.channel_number = 1
        return self.current_channel()

    def next_channel(self):
        if self.channel_number == len(self.channels):
            self.channel_number = 1
            return self.current_channel()
        else:
            self.channel_number += 1
            return self.current_channel()

    def turn_channel(self, channel_num):
        if channel_num < 1 or channel_num > len(self.channels):
            raise ValueError("Invalid channel number")
        self.channel_number = channel_num
        return self.current_channel()

    def previous_channel(self):
        if self.channel_number == 1:
            self.channel_number = len(self.channels)
        else:
            self.channel_number -= 1
        return self.current_channel()

    def last_channel(self):
        self.channel_number = len(self.channels)
        return self.current_channel()

    def current_channel(self):
        return self.channels[self.channel_number - 1]

    def exists(self, search_value):
        if isinstance(search_value, int):
            return 1 <= search_value <= len(self.channels)
        elif isinstance(search_value, str):
            return search_value in self.channels


CHANNELS = ["BBC", "Discovery", "TV1000"]

controller = TVController(CHANNELS)

print(controller.first_channel())  # "BBC"
print(controller.last_channel())  # "TV1000"
print(controller.turn_channel(1))  # "BBC"      — channels are numbered from 1, not 0
print(controller.next_channel())  # "Discovery"
print(controller.previous_channel())  # "BBC"
print(controller.current_channel())  # "BBC"
print(controller.exists(4))  # False
print(controller.exists("BBC"))  # True


# print(controller.next_channel())
# print(controller.turn_channel(0))
