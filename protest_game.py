import typing, json, protest_db

class Game:
    """
    tablename: games
    columns: id int, creator int, name text, rounds int, content int, matrix int, added datetime
    """

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table games (id int, creator int, name text, rounds int, content int, matrix int, added datetime)')
        cl.commit()