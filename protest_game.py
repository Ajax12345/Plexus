import typing, json, protest_db
import time, random

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

    @classmethod
    def load_full_game_instance(cls, _payload:dict) -> dict:
        full_payload, loaders = {}, {**{(i, 'dsc'):json.loads for i in ['matrix', 'content', 'game']}, ('matrix', 'reactions'):json.loads, ('matrix', 'payoffs'):json.loads, ('matrix', 'actors'):json.loads, ('content', 'content'):json.loads}
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select g.* from games g where g.id = %s', [int(_payload['gid'])])
            full_payload['game'] = cl.fetchone()
            cl.execute('select w.* from waitingroom w where w.id = %s and w.gid = %s', [int(_payload['uid']), int(_payload['gid'])])
            full_payload['user'] = cl.fetchone()
            cl.execute('select m.* from matrices m where m.id = %s', [int(full_payload['game']['matrix'])])
            full_payload['matrix'] = cl.fetchone()
            cl.execute('select c.* from content c where c.id = %s', [int(full_payload['game']['content'])])
            full_payload['content'] = cl.fetchone()
            cl.execute('select max(id) gpid from gameplays')
            cl.execute('insert into gameplays values (%s, %s, now(), null, 1)', [(gpid:=(1 if (cid:=cl.fetchone()['gpid']) is None else int(cid)+1)), int(_payload['gid'])])
            cl.commit()
            full_payload['gameplay'] = {'id':gpid}

        with open('round_response_templates.json') as f:
            return {**{a:{j:loaders.get((a, j), lambda x:x)(k) if j != 'added' else str(k) for j, k in b.items()} for a, b in full_payload.items()}, 'response_template':json.load(f)}


class GameRun:
    """
    tables:
        tablename: waitingroom
        columns: id int, gid int, name text, email text, `status` int, added datetime

        tablename: gameplays
        columns: id int, gid int, start datetime, end datetime, demo int

        tablename: messages
        columns: id int, gid int, poster int, body longtext, reply int, is_player int, added longtext
    
        tablename: roles
        columns: id int, gid int, actor int

        tablename: reactions
        columns: id int, gid int, actor int, round int, reaction int
    """
    @classmethod
    def add_invitee(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from waitingroom')
            cl.execute('insert into waitingroom values (%s, %s, %s, %s, %s, now())', [(_id:=(1 if (v:=cl.fetchone()[0]) is None else int(v)+1)), int(_payload['gid']), _payload['name'], _payload['email'], 0])
            cl.commit()
        return {'status':True, 'id':_id}

    @classmethod
    def invite_demo_players(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.executemany('insert into waitingroom values ((select max(w.id) + 1 from waitingroom w), %s, %s, %s, %s, now())', [[int(_payload['gid']), f'Player{i}', f'player{time.time()}@protestgame.com', 0] for i in range(1, 20)])
            cl.commit()
            cl.execute('select w.id, w.name, w.email from waitingroom w where gid = %s and `status` = 0 and email regexp "player[0-9]+\\.[0-9]+@protestgame\\.com"', [int(_payload['gid'])])
        return {'status':True, 'players':list(cl)}

    @classmethod
    def post_message(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from messages')
            cl.execute('insert into messages values (%s, %s, %s, %s, %s, %s, %s)', [(mid:=(1 if (_mid:=cl.fetchone()[0]) is None else int(_mid)+1)), int(_payload['gid']), int(_payload['poster']), _payload['body'], _payload['reply'], _payload['is_player'], str(_payload['added'])])
            cl.commit()
        return {'status':True, 'id':mid}

    @classmethod
    def assign_roles(cls, _payload:dict, demo:typing.Optional[bool] = True) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict=True) as cl:
            cl.execute('select id, name, email from waitingroom where gid = %s and status=0', [int(_payload['id'])])
            players = list(cl)
            random.shuffle(players)
            cl.execute('''
                with u_ids(id) as (
                    {}
                )
                update waitingroom set status=1 where id in (select * from u_ids)
            '''.format('\nunion all\n'.join(f'select {i["id"]}' for i in players)))
            cl.commit()
            cl.execute('select m.actors a from games g join matrices m on g.matrix = m.id where g.id = %s', [int(_payload['id'])])
            actors, p = json.loads(cl.fetchone()['a']), iter(players)
            roles = {int(a):list(filter(None, [next(p, None) for _ in range(len(players)//len(actors))])) for a in actors}
            if demo:
                assert len(set([len(b) for b in roles.values()])) == 1
            
            cl.executemany('insert into roles values (%s, %s, %s)', [[int(j['id']), int(_payload['gid']), a] for a, b in roles.items() for j in b])
            cl.commit()

        return {'status':True, 'roles':roles}

    @classmethod
    def round_text(cls, _round:int) -> str:
        c = {1:'first', 2:'second', 3:'third', 4:'fourth', 5:'fifth', 6:'sixth', 7:'seventh', 8:'eight', 9:'ninth', 10:'tenth', 11:'eleventh', 12:'twelfth', 13:'thirteenth', 20:'twentieth', 30:'thirtieth', 100:'hundredth'}
        if _round in c:
            return c[_round]
        
        if _round < 20:
            return f'{c[int(str(_round)[0])]}teenth'

        #will add to this as necessary
        


    @classmethod
    def submit_side_reactions(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.executemany('insert into reactions values (%s, %s, %s, %s, %s)', [[int(i['id']), int(_payload['gid']), int(_payload['side']), int(_payload['round']), int(i['reaction'])] for i in _payload['reactions']])
            cl.commit()
            cl.execute('''
                with recursive all_reactions(al, i1, i2, r, rf) as (
                    select json_keys(m.actors), 0, 1, 
                        json_extract(m.reactions, concat('$.', json_extract(json_keys(m.actors), '$[0]'), '[0]')),
                        m.reactions
                        from gameplays gpls join games g on gpls.gid = g.id join matrices m on m.id = g.matrix where gpls.id = %s
                    union all
                    select al, case when i2 + 1 >= json_length(json_extract(rf, concat('$.', json_extract(al, concat('$[', i1, ']'))))) then i1+1 else i1 end, case when i2 + 1 < json_length(json_extract(rf, concat('$.', json_extract(al, concat('$[', i1, ']'))))) then i2+1 else 0 end, 
                        json_extract(rf, concat('$.', json_extract(al, concat('$[', i1, ']')), concat('[', i2, ']'))),
                        rf
                        from all_reactions where i1 < json_length(al) or i2 < json_length(json_extract(rf, concat('$.', json_extract(al, concat('$[', i1, ']')))))
                ),
                round_results as (
                    select distinct r.gid, r.actor, r.round from reactions r where r.gid = %s
                ),
                reaction_freqs(a, r, f) as (
                    select r.actor, r.reaction, count(*) from reactions r where r.gid = %s and r.round = %s group by r.actor, r.reaction
                ),
                chosen_reactions(a, r) as (
                    select f1.a, f1.r from reaction_freqs f1 where f1.f = (select max(f2.f) from reaction_freqs f2 where f2.a = f1.a)
                )
                select distinct c.*, json_extract(all_r.r, '$.reaction') from chosen_reactions c join all_reactions all_r on c.r = json_extract(all_r.r, '$.id')
                union all
                select null, (select count(*) from round_results) = (select json_length(m.actors) from gameplays gpls join games g on gpls.gid = g.id join matrices m on m.id = g.matrix where gpls.id = %s), null
                union all
                select m.actors, m.payoffs, null from gameplays gpls join games g on gpls.gid = g.id join matrices m on m.id = g.matrix where gpls.id = %s
            ''', [int(_payload['gid']), int(_payload['gid']), int(_payload['gid']), int(_payload['round']), int(_payload['gid']), int(_payload['gid'])])
            *reactions, [_, status, _], [_actors, _payoffs, _] = cl
            actors, payoffs = json.loads(_actors), json.loads(_payoffs)
            print(reactions, status, actors, payoffs)
            parent_response = {
                **dict(zip(['a1', 'a2'], [b['name'] for b in actors.values()])),
                'round_int':int(_payload['round']),
                'round_text':cls.round_text(int(_payload['round'])),
                'round_finished':bool(int(status)),
                'actor_move_next':(n_actor:=[(a, b['name']) for a, b in actors.items() if int(a) != int(_payload['side'])][0])[-1],
                'actor_move_next_id':n_actor[0]
            }
            if not int(status):
                print('in this intermediary response')
                return {
                    **parent_response,
                    'a':int(_payload['side']),
                    'a_move':actors[str(_payload['side'])]['name'],
                    'reaction':reactions[-1][-1][1:-1],
                }

            return parent_response


if __name__ == '__main__':
    '''
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table waitingroom (id int, gid int, name text, email text, status int, added datetime)')
        cl.commit()
    '''
    print(GameRun.assign_roles({'id':1, 'gid':1}))