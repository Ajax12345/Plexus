import typing, pymysql.cursors
from pymysql.constants import FIELD_TYPE
from pymysql.converters import conversions

class DbClient:
    def __init__(self, **kwargs:dict) -> None:
        self.__dict__ = kwargs

    def __enter__(self) -> typing.Callable:
        conv = conversions.copy()
        conv[FIELD_TYPE.DECIMAL] = float
        conv[FIELD_TYPE.NEWDECIMAL] = float
        self.connection = pymysql.connect(host=self.host, user=self.user, password=self.password, database=self.database, conv = conv, cursorclass=pymysql.cursors.SSCursor if not self.__dict__.get('as_dict', False) else pymysql.cursors.DictCursor)
        self.cursor = self.connection.cursor()
        return self

    def __getattr__(self, _n:str) -> typing.Any:
        return getattr(self.cursor, _n)

    def commit(self) -> None:
        self.connection.commit()

    def __exit__(self, *_) -> None:
        self.cursor.close()
        self.connection.close()

if __name__ == '__main__':
    with DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('select now()')
        print(cl.fetchone())