import typing, protest_db, json

class Matrix:
    """
    tablename: matrices
    columns: id int, creator int, name text, dsc longtext, move int, actors longtext, reactions longtext, payoffs longtext, added datetime
    """
    @classmethod
    def create_matrix(cls, creator:int, payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from matrices')
            cl.execute('insert into matrices values (%s, %s, %s, %s, %s, %s, %s, %s, now())', [(mid:=(1 if (c:=cl.fetchone()[0]) is None else c + 1)), int(creator), payload['name'], json.dumps(payload['desc']), payload['move'], json.dumps(payload['actors']), json.dumps(payload['reactions']), json.dumps(payload['payoffs'])])
            cl.commit()
        return {'status':True, 'id':mid}

    @classmethod
    def all_matrices(cls, creator:int) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict=True) as cl:
            cl.execute('select m.* from matrices m where m.creator = %s order by m.added desc', [int(creator)])
            ops = {**dict(zip(['dsc', 'actors', 'reactions', 'payoffs'], [json.loads]*4)), 'added':str}
            return {'matrices':json.dumps([{a:ops.get(a, lambda x:x)(b) for a, b in i.items()} for i in cl])}

    @classmethod
    def has_matrices(cls, creator:int) -> bool:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select exists (select 1 from matrices m where m.creator = %s)', [int(creator)])
            return bool(cl.fetchone()[0])

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table matrices (id int, creator int, name text, dsc longtext, move int, actors longtext, reactions longtext, payoffs longtext, added datetime)')
        cl.commit()
        
    