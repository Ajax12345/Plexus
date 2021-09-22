import typing, json, protest_db

class AllGames:
    def __init__(self, _games:typing.List['Game']) -> None:
        self.games = _games
    
    def __bool__(self) -> bool:
        return bool(self.games)

    def __len__(self) -> int:
        return len(self.games)

    @property
    def games_num(self) -> int:
        return len(self)

    def __iter__(self) -> typing.Iterator:
        yield from self.games


class Game:
    """
    tablename: games
    columns: id int, creator int, name text, rounds int, content int, matrix int, added datetime
    """
    def __init__(self, _d:dict) -> None:
        self.__dict__ = _d

    @property
    def to_json(self) -> str:
        return json.dumps({a:str(b) if a == 'added' else b for a, b in self.__dict__.items()})

    @classmethod
    def create_game(cls, creator:int, payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from games')
            cl.execute('insert into games values (%s, %s, %s, %s, %s, %s, now())', [(_id:=(1 if (m:=cl.fetchone()[0]) is None else m + 1)), int(creator), payload['name'], int(payload['rounds']), int(payload['content']), int(payload['matrix'])])
            cl.commit()
        return {'status':True, 'id':_id}

    @classmethod
    def get_game(cls, creator:int, _id:int) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select g.*, c.name content_name, m.name matrix_name from games g join content c on g.content = c.id join matrices m on g.matrix = m.id where g.id = %s and g.creator = %s', [int(_id), creator])
            if (g:=cl.fetchone()) is None:
                return {'status':False}
            return {'status':True, 'game':cls(g)}

    @classmethod
    def update_game(cls, creator:int, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('update games set name = %s, rounds = %s where id = %s', [_payload['name'], int(_payload['rounds']), int(_payload['id'])])
            cl.commit()
        return {'status':True}

    @classmethod
    def instantiate_game(cls, _payload:dict, cursor:protest_db.DbClient) -> 'Game':
        return cls(_payload)

    @classmethod
    def get_all_games(cls, _id:int) -> AllGames:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select g.* from games g where g.creator = %s order by added desc', [int(_id)])
            return AllGames([cls.instantiate_game(i, cl) for i in cl])

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table games (id int, creator int, name text, rounds int, content int, matrix int, added datetime)')
        cl.commit()