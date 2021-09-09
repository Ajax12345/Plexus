import typing

class FromGame:
    def __init__(self, g_id:typing.Union[int, None]) -> None:
        self.g_id = g_id

    def __bool__(self) -> bool:
        return bool(self.g_id)
    
    def __repr__(self) -> str:
        return f'{self.__class__.__name__}({self.g_id})'