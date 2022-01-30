import typing, json, protest_db
import time, random, pusher

pusher_client = pusher.Pusher(
  app_id='814342',
  key='f7e3f6c14176cdde1625',
  secret='5f4648c5a702b25bdb23',
  cluster='us2',
  ssl=True
)

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
    def status_text(self) -> str:
        if not any([self.players_waiting, self.has_started]):
            return "Not started yet"
        
        if self.players_waiting:
            return f'{self.players_waiting} player{"s" if self.players_waiting != 1 else ""} waiting'
        
        return "In progress"

    @property
    def status_class(self) -> str:
        if not any([self.players_waiting, self.has_started]):
            return ""
        
        if self.players_waiting:
            return "game-status-players-waiting"
        
        return "game-status-in-progress"

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
            cl.execute('select g.*, c.name content_name, m.name matrix_name, (select count(*) from waitingroom w where w.gid = g.id and w.status = 0) players_waiting, exists (select 1 from gameplays gpls where gpls.gid = g.id and gpls.end is null and gpls.demo = 0) has_started from games g join content c on g.content = c.id join matrices m on g.matrix = m.id where g.id = %s and g.creator = %s', [int(_id), creator])
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
    def load_game_instance_instructor(cls, _payload:dict) -> dict:
        full_payload, loaders = {}, {**{(i, 'dsc'):json.loads for i in ['matrix', 'content', 'game']}, ('matrix', 'reactions'):json.loads, ('matrix', 'payoffs'):json.loads, ('matrix', 'actors'):json.loads, ('content', 'content'):json.loads}
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select g.* from games g where g.id = %s', [int(_payload['gid'])])
            full_payload['game'] = cl.fetchone()
            cl.execute('select u.* from users u where u.id = %s', [int(full_payload['game']['creator'])])
            full_payload['user'] = cl.fetchone()
            cl.execute('select m.* from matrices m where m.id = %s', [int(full_payload['game']['matrix'])])
            full_payload['matrix'] = cl.fetchone()
            cl.execute('select c.* from content c where c.id = %s', [int(full_payload['game']['content'])])
            full_payload['content'] = cl.fetchone()
            cl.execute('select id from gameplays where end is null and demo != 1 and gid=%s', [int(_payload['gid'])])
            full_payload['gameplay'] = {'id':None if (v:=cl.fetchone()) is None else v['id']}
            cl.execute('select id, name, email from waitingroom where status = 0 and gid = %s', [int(_payload['gid'])])
            waitingroom = list(cl)

        return {**{a:{j:loaders.get((a, j), lambda x:x)(k) if j not in ['added', 'jdate'] else str(k) for j, k in b.items()} for a, b in full_payload.items()}, 'waitingroom':waitingroom}

    @classmethod
    def load_full_game_instance(cls, _payload:dict) -> dict:
        #NOTE: This is the loader instance for the demo game, NOT the live gameplay feature
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

        with open('round_response_templates.json') as f, open('demo_1_about_slide.json') as f2:
            return {**{a:{j:loaders.get((a, j), lambda x:x)(k) if j != 'added' else str(k) for j, k in b.items()} for a, b in full_payload.items()}, 'response_template':json.load(f), 'about_slide':json.load(f2)}

    @classmethod
    def has_game(cls, _id:int) -> bool:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select exists (select 1 from games where id = %s) result', [int(_id)])
            return cl.fetchone()['result']

    @classmethod
    def owns_game(cls, _user:int, _id:int) -> bool:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db', as_dict = True) as cl:
            cl.execute('select exists (select 1 from games where id = %s and creator = %s) result', [int(_id), int(_user)])
            return cl.fetchone()['result']


class GameRun:
    singularity = {
        'police':False
    }
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

        tablename: rounds
        columns: gid int, round int, actor int, reaction int, payout int
    """
    @classmethod
    def add_invitee(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select max(id) from waitingroom')
            cl.execute('insert into waitingroom values (%s, %s, %s, %s, %s, now())', [(_id:=(1 if (v:=cl.fetchone()[0]) is None else int(v)+1)), int(_payload['gid']), _payload['name'], _payload['email'], 0])
            cl.commit()

        if not _payload['is_demo']:
            pusher_client.trigger('game-events', f'game-events-{_payload["gid"]}', {'handler':1, 'payload':{'uid':_id, 'name':_payload['name'], 'email':_payload['email']}})

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
                update waitingroom set status=1 where id in ({})
            '''.format(', '.join(str(i['id']) for i in players)))
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
    def is_singular(cls, _name:str) -> bool:
        return cls.singularity.get(_name.lower(), _name[-1] != 's')

    @classmethod
    def past_to_be(cls, _name:str) -> str:
        return 'was' if cls.is_singular(_name) else 'were'

    @classmethod
    def possessive_tense(cls, _name:str) -> str:
        return 'has' if cls.is_singular(_name) else 'have'
    
    @classmethod
    def make_tense(cls, _name:str) -> str:
        return 'makes' if cls.is_singular(_name) else 'make'
        
    @classmethod
    def submit_side_reactions(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.executemany('insert into reactions values (%s, %s, %s, %s, %s)', [[int(i['id']), int(_payload['gid']), int(_payload['side']), int(_payload['round']), int(i['reaction'])] for i in _payload['reactions']])
            cl.commit()
            cl.execute('''
                -- note: not entirely my fault that this is so messy, pythonanywhere only supports mysql version 5.7, thus, no ctes allowed
                select distinct c.a, c.r, null from (
                    select f1.a a, f1.r r, max(f1.f) agg_p 
                    from (select r.actor a, r.reaction r, count(*) f 
                        from reactions r 
                        where r.gid = %s and r.round = %s group by r.actor, r.reaction) f1 
                    where f1.f = (select max(f2.f) from (select r.actor a, r.reaction r, count(*) f 
                                    from reactions r where r.gid = %s and r.round = %s group by r.actor, r.reaction) f2 
                                    where f2.a = f1.a) group by f1.a, f1.r) c
                union all
                select null, (select count(*) from (select distinct r.gid, r.actor from reactions r where r.gid = %s and r.round = %s) round_results) = (select json_length(m.actors) from gameplays gpls join games g on gpls.gid = g.id join matrices m on m.id = g.matrix where gpls.id = %s), null
                union all
                select m.actors, m.payoffs, m.reactions from gameplays gpls join games g on gpls.gid = g.id join matrices m on m.id = g.matrix where gpls.id = %s
            ''', [int(_payload['gid']), int(_payload['round']), int(_payload['gid']), int(_payload['round']), int(_payload['gid']), int(_payload['round']), int(_payload['gid']), int(_payload['gid'])])
            *reactions, [_, status, _], [_actors, _payoffs, _reactions] = cl
            actors, payoffs, rcts = json.loads(_actors), json.loads(_payoffs), {int(a):{int(j['id']):j['reaction'] for j in b} for a, b in json.loads(_reactions).items()}
            print(reactions, status, actors, payoffs)
            r_d, r_r1 = {int(a):int(b) for a, b, _ in reactions}, {int(a):rcts[int(a)][int(b)] for a, b, _ in reactions}
            parent_response = {
                'a':int(_payload['side']),
                'a_move':(a_move:=actors[str(_payload['side'])]['name']),
                'a_past_to_be_tense':cls.past_to_be(a_move),
                'reaction':r_r1[int(_payload['side'])],
                **dict(zip(['a1', 'a2'], (a_t:=[b['name'] for b in actors.values()]))),
                'round_int':int(_payload['round']),
                'round_text':cls.round_text(int(_payload['round'])).capitalize(),
                'round_finished':bool(int(status)),
                'actor_move_next':(n_actor:=[(a, b['name']) for a, b in actors.items() if int(a) != int(_payload['side'])][0])[-1],
                'actor_move_next_id':n_actor[0],
                'actor_move_next_make_tense':cls.make_tense(n_actor[-1]),
                **{f'a{i}_past_to_be_tense':cls.past_to_be(a) for i, a in enumerate(a_t, 1)}
            }
            if not int(status):
                return parent_response

            print('r_d and r_r1', r_d, r_r1)
            payout = [i['payouts'] for i in payoffs if all(int(i['reactions'][str(a)]['id']) == int(b) for a, b in r_d.items())]
            print('payout1 ', payout)
            payout = payout[0]
            print('new payout', payout)
            cl.executemany('insert into rounds values (%s, %s, %s, %s, %s)', [[int(_payload['gid']), int(_payload['round']), int(a), int(b), int(payout[str(a)])] for a, b in r_d.items()])
            cl.commit()
            #order by pnts desc
            cl.execute('''
                (select t1.* from (select r.actor, sum(r.payout) pnts from rounds r where r.gid = %s group by r.actor) t1 order by t1.pnts desc)
                ''', [int(_payload['gid'])])
            [w_a, w_s], [l_a, l_s] = cl
            print('winners and losers', [w_a, w_s], [l_a, l_s])
            cl.execute('''
                select t2.* from (select r.actor, sum(r.payout) pnts from rounds r where r.gid = %s and r.round = %s group by r.actor) t2 order by t2.pnts desc
            ''', [int(_payload['gid']), int(_payload['round'])-1])
            [w_a1, w_s1], [l_a1, l_s1] = (last_round if (last_round:=list(cl)) else [[None, None]]*2)
            print('winners and losers last round',[w_a1, w_s1], [l_a1, l_s1])
            running_scores, a_arr, transition_state = {w_a:w_s, l_a:l_s}, list(actors), ''
            if w_a1 is not None:
                if w_a == w_a1:
                    transition_state = 'still '
                else:
                    transition_state = 'now '
            print('detected transition', transition_state)
            return {
                **parent_response,
                **{f'a{i}_points':int(payout[a]) for i, a in enumerate(actors, 1)},
                **{f'a{i}_reaction':r_r1[int(a)] for i, a in enumerate(actors, 1)},
                **{f'a{i}_total_score':running_scores[int(a)] for i, a in enumerate(actors, 1)},
                'actor_running_winner':(a_rw:=actors[str(w_a)]['name']),
                'actor_running_winner_id':int(w_a),
                'actor_running_winner_score':int(w_s),
                'actor_running_loser':actors[str(l_a)]['name'],
                'actor_running_loser_id':int(l_a),
                'actor_running_loser_score':int(l_s),
                'round_winner':(round_winner:=(actors[(ra_w:=(a_arr[0] if int(payout[a_arr[0]]) > int(payout[a_arr[1]]) else a_arr[1]))]['name'])),
                'round_winner_id':int(ra_w),
                'round_winner_points':(rw_points:=int(payout[ra_w])),
                'round_winner_reaction':r_r1[int(ra_w)],
                'round_loser':(round_loser:=(actors[(ra_l:=(a_arr[0] if int(payout[a_arr[1]]) > int(payout[a_arr[0]]) else a_arr[1]))]['name'])),
                'round_loser_id':int(ra_l),
                'round_loser_points':(rl_points:=int(payout[ra_l])),
                'round_loser_reaction':r_r1[int(ra_l)],
                'round_transition_state':transition_state,
                'round_winner_point_desc_text':f'point{"s" if rw_points != 1 else ""}',
                'round_loser_point_desc_text':f'point{"s" if rl_points != 1 else ""}',
                'lead_text_winner':'leads' if cls.is_singular(a_rw) else "lead",
                'round_winner_past_to_be_tense':cls.past_to_be(round_winner),
                'round_loser_past_to_be_tense':cls.past_to_be(round_loser),
                'round_winner_possessive':cls.possessive_tense(round_winner),
                'actor_running_winner_possessive':cls.possessive_tense(a_rw)
            }


if __name__ == '__main__':
    '''
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute('create table waitingroom (id int, gid int, name text, email text, status int, added datetime)')
        cl.commit()
    '''
    #print(GameRun.assign_roles({'id':1, 'gid':1}))
    print(Game.has_game(2))