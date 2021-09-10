import typing, protest_db, json

class Content:
    """
    tablename: content
    columns: id int, creator int, name text, dsc mediumtext, content longtext, added datetime
    """
    @classmethod
    def create_content(cls, creator:int, payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from content')
            cl.execute('insert into content values (%s, %s, %s, %s, %s, now())', [(_id:=(1 if (tid:=cl.fetchone()[0]) is None else int(tid)+1)), int(creator), payload['title'], json.dumps(payload['desc']), json.dumps(payload['content'])])
            cl.commit()

        return {'status':True, 'id':_id}

    @classmethod
    def has_content(cls, creator:int) -> bool:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select exists (select 1 from content where creator = %s)', [int(creator)])
            return cl.fetchone()[0]

    @classmethod
    def get_all_content(cls, creator:int) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select c.id, c.name, c.dsc, c.content from content c where c.creator = %s', [int(creator)])
            return {'content':json.dumps([[a, b, *map(json.loads, c)] for a, b, *c in cl])}
    

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table if not exists content (id int, creator int, name text, dsc mediumtext, content longtext, added datetime)')
        cl.commit()