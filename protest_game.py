import typing, json, protest_db

class Game:
    """
    tablename: games
    columns: id int, creator int, name text, rounds int, content int, matrix int, added datetime
    """
    @classmethod
    def create_game(cls, creator:int, payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from games')
            cl.execute('insert into games values (%s, %s, %s, %s, %s, %s, now())', [(_id:=(1 if (m:=cl.fetchone()[0]) is None else m + 1)), int(creator), payload['name'], int(payload['rounds']), int(payload['content']), int(payload['matrix'])])
            cl.commit()
        return {'status':True, 'id':_id}

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table games (id int, creator int, name text, rounds int, content int, matrix int, added datetime)')
        cl.commit()