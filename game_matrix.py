import typing, protest_db, json

class Matrix:
    """
    tablename: matrices
    columns: id int, creator int, name text, dsc longtext, move int, actors longtext, reactions longtext, payoffs longtext, added datetime
    """
    def __init__(self, _payload:dict) -> None:
        self.__dict__ = _payload

    @property
    def to_json(self) -> str:
        return json.dumps({a:b if a != 'added' else str(b) for a, b in self.__dict__.items()})

    @property
    def occurrence_text(self) -> str:
        return f'Used in {"0" if self.g_count is None else int(self.g_count)} game{"s" if self.g_count != 1 else ""}'

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

    @classmethod
    def instantiate_matrix(cls, _payload:dict, cursor:protest_db.DbClient) -> 'Matrix':
        return cls(_payload)

    @classmethod
    def get_matrix(cls, _id:int) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select m.*, (select sum(m.id = g.matrix) from games g) g_count from matrices m where m.id = %s', [int(_id)])
            if (m:=cl.fetchone()) is not None:
                loaders = {'dsc':json.loads, 'actors':json.loads, 'reactions':json.loads, 'payoffs':json.loads}
                return {'status':True, 'matrix':cls.instantiate_matrix({a:loaders.get(a, lambda x:x)(b) for a, b in m.items()}, cl)}
        return {'status':False}

    @classmethod
    def update_matrix(cls, _owner:int, _payload:dict) -> dict:
        print(_payload)
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('update matrices set name=%s, dsc = %s, actors=%s, reactions=%s, payoffs = %s where id=%s and creator=%s', [_payload['payload']['name'], json.dumps(_payload['payload']['dsc']), json.dumps(_payload['payload']['actors']), json.dumps(_payload['payload']['reactions']), json.dumps(_payload['payload']['payoffs']), int(_payload['id']), int(_owner)])
            cl.commit()
        return {'status':True}

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table matrices (id int, creator int, name text, dsc longtext, move int, actors longtext, reactions longtext, payoffs longtext, added datetime)')
        cl.commit()
        
    