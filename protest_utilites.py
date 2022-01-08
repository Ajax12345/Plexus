import typing, re, json
import protest_db

class FromGame:
    def __init__(self, g_id:typing.Union[int, None]) -> None:
        self.g_id = g_id

    def __bool__(self) -> bool:
        return bool(self.g_id)
    
    def __repr__(self) -> str:
        return f'{self.__class__.__name__}({self.g_id})'


def get_template_params(d):
    if not isinstance(d, (dict, list)):
        yield from re.findall('\{(\w+)\}', d)
    elif isinstance(d, list):
        yield from [j for i in d for j in get_template_params(i)]
    else:
        yield from [j for b in d.values() for j in get_template_params(b)]

def add_to_waitlist(payload:dict) -> dict:
    with protest_db.DbClient(host='localhost', user='root', password='Gobronxbombers2', database='protest_db') as cl:
        cl.execute("insert into waitlist values (%s, now())", [payload['email']])
        cl.commit()
        
    return {'success':True}

if __name__ == '__main__':
    with open('round_response_templates.json') as f:
        print(sorted(set(get_template_params(json.load(f)))))