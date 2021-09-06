import typing, re
import protest_db

class User:
    '''
    tablename: users
    cols: (id int, first_name text, last_name text, email text, password text, jdate datetime)
    '''
    def __init__(self, **kwargs:dict) -> None:
        self.__dict__ = kwargs

    def __repr__(self) -> str:
        return f'{self.__class__.__name__}({self.id})'

    @classmethod
    def signin_user(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select id from users where email = %s and password = %s', [_payload['email'], _payload['password']])
            if (_id:=cl.fetchone()) is None:
                return {'status':False, 'message':'Invalid email or password'}
            return {'status':True, 'user':int(_id[0])}

    @classmethod
    def add_user(cls, _payload:dict) -> dict:
        with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
            cl.execute('select exists (select 1 from users where email = %s)', (_payload['email'],))
            if cl.fetchone() is not None:
                return {'status':False, 'message':'That email already exists. <a href="/SignIn">Sign in?</a>'}
            
            cl.execute('select max(id) from users')
            cl.execute('insert into users values (%s, %s, %s, %s, %s, now())', [(uid:=(1 if (_id:=cl.fetchone()) is None else int(_id[0])+1)), _payload['first_name'], _payload['last_name'], _payload['email'], _payload['password']])
            cl.commit()
            return {'status':True, 'user':uid}
        

if __name__ == '__main__':
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        """
        cl.execute('create table users (id int, first_name text, last_name text, email text, password text, jdate datetime)')
        cl.commit()
        """
    