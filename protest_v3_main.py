import flask, protest_users, json
import typing, functools, random, string
import protest_utilites, game_content
import game_matrix, protest_game, re

app = flask.Flask(__name__)
app.secret_key = ''.join(random.choice(string.ascii_letters+string.digits+string.punctuation) for _ in range(30))

def is_loggedin(_f:typing.Callable) -> typing.Callable:
    @functools.wraps(_f)
    def wrapper(*args, **kwargs) -> typing.Any:
        if flask.session.get('id') is None:
            return flask.redirect('/')
        return _f(*args, **kwargs)
    return wrapper

@app.route('/', methods=['GET'])
def main():
    return flask.render_template('demo_landing.html')

@app.route('/dashboard/games', methods=['GET'])
@is_loggedin
def dashboard_games():
    if not (games:=protest_game.Game.get_all_games(int(flask.session['id']))):
        return flask.render_template('dashboard_onboard.html', user=protest_users.User.get_user(int(flask.session['id'])))
    return flask.render_template('dashboard.html', games = games, user=protest_users.User.get_user(int(flask.session['id'])))

@app.route('/dashboard/content', methods=['GET'])
@is_loggedin
def dashboard_content():
    if not game_content.Content.has_content(flask.session['id']):
        return flask.redirect('/dashboard')
    return flask.render_template('dashboard_content.html', user = protest_users.User.get_user(flask.session['id']))

@app.route('/get-all-content', methods=['POST'])
def get_all_content():
    return flask.jsonify(game_content.Content.get_all_content(flask.session['id']))

@app.route('/dashboard/matrices', methods=['GET'])
@is_loggedin
def dashboard_matrices():
    if not game_matrix.Matrix.has_matrices(flask.session['id']):
        return flask.redirect('/dashboard')
    return flask.render_template('dashboard_matrices.html', user = protest_users.User.get_user(flask.session['id']))

@app.route('/get-all-matrices', methods=['POST'])
def get_all_matrices():
    return flask.jsonify(game_matrix.Matrix.all_matrices(flask.session['id']))

@app.route('/dashboard-onboard', methods=['GET'])
def dashboard_onboard():
    return flask.render_template('dashboard_onboard.html')

@app.route('/create/game', methods=['GET'])
@is_loggedin
def create_game():
    return flask.render_template('create_game.html', user=protest_users.User.get_user(int(flask.session['id'])))

@app.route('/create-game', methods=['POST'])
def _create_game():
    return flask.jsonify(protest_game.Game.create_game(int(flask.session['id']), json.loads(flask.request.form['payload'])))

@app.route('/create-game-2', methods=['GET'])
def create_game_2():
    return flask.render_template('create_game_2.html')

@app.route('/create-game-3', methods=['GET'])
def create_game_3():
    return flask.render_template('create_game_3.html')

@app.route('/create/content', methods=['GET'])
@is_loggedin
def create_content():
    return flask.render_template('create_content_1.html', r_g = protest_utilites.FromGame(flask.request.args.get('g_redirect')), user=protest_users.User.get_user(int(flask.session['id'])))

@app.route('/add-content', methods=['POST'])
def add_content():
    return flask.jsonify(game_content.Content.create_content(flask.session['id'], json.loads(flask.request.form['payload'])))

@app.route('/create-content-2', methods=['GET'])
def create_content_2():
    raise Exception('depreciated')
    return flask.render_template('create_content_2.html')

@app.route('/create/matrix', methods=['GET'])
@is_loggedin
def create_matrix():
    return flask.render_template('create_matrix.html', r_g = protest_utilites.FromGame(flask.request.args.get('g_redirect')), user=protest_users.User.get_user(int(flask.session['id'])))

@app.route('/create-matrix', methods=['POST'])
def _create_matrix():
    return flask.jsonify(game_matrix.Matrix.create_matrix(flask.session['id'], json.loads(flask.request.form['payload'])))

@app.route('/create-matrix-2', methods=['GET'])
def create_matrix_2():
    return flask.render_template('create_matrix_2.html')

@app.route('/create-matrix-3', methods=['GET'])
def create_matrix_3():
    return flask.render_template('create_matrix_3.html')

@app.route('/create-matrix-4', methods=['GET'])
def create_matrix_4():
    return flask.render_template('create_matrix_4.html')

@app.route('/first-player-game-window', methods=['GET'])
def first_player_game_window():
    return flask.render_template('game_window_v3.html')

@app.route('/fourth-player-game-window', methods=['GET'])
def fourth_player_game_window():
    return flask.render_template('game_window_v3_4.html')

@app.route('/second-player-game-window', methods=['GET'])
def second_player_game_window():
    return flask.render_template('game_window_v3_1.html')

@app.route('/third-player-game-window', methods=['GET'])
def third_player_game_window():
    return flask.render_template('game_window_v3_2.html')

@app.route('/instructor-player-game-window', methods=['GET'])
def instructor_player_game_window():
    return flask.render_template('game_window_v3_3.html')

@app.route('/game/<id>', methods=['GET'])
@is_loggedin
def game_dashboard(id):
    if not (game:=protest_game.Game.get_game(int(flask.session['id']), int(id)))['status']:
        return flask.redirect('/') #TODO: add 404 here
    print(game['game'].__dict__)
    return flask.render_template('game_dashboard.html', user = protest_users.User.get_user(flask.session['id']), game=game['game'])

@app.route('/update-game', methods=['POST'])
def update_game():
    return flask.jsonify(protest_game.Game.update_game(int(flask.session['id']), json.loads(flask.request.form['payload'])))

@app.route('/game1/testgame', methods=['GET'])
def game_dashboard1():
    return flask.render_template('game_dashboard_1.html')

@app.route('/game2/testgame', methods=['GET'])
def game_dashboard2():
    return flask.render_template('game_dashboard_2.html')

@app.route('/matrix/<mid>', methods=['GET'])
@is_loggedin
def matrix_dashboard(mid):
    if not (matrix:=game_matrix.Matrix.get_matrix(int(mid)))['status']:
        return flask.redirect('/') #TODO: add 404
        
    return flask.render_template('matrix_dashboard.html', user = protest_users.User.get_user(flask.session['id']), matrix = matrix['matrix'])

@app.route('/content/<cid>', methods=['GET'])
@is_loggedin
def content_dashboard(cid):
    if not (g_c:=game_content.Content.get_content(flask.session['id'], int(cid)))['status']:
        return flask.redirect('/') #TODO: add 404 here
    return flask.render_template('content_dashboard.html', user=protest_users.User.get_user(flask.session['id']), content = g_c['content'])

@app.route('/update-content', methods=['POST'])
def update_content():
    return flask.jsonify(game_content.Content.update_content(flask.session['id'], json.loads(flask.request.form['payload'])))

@app.route('/SignUp', methods=['GET'])
def sign_up():
    return flask.render_template('sign_up.html')

@app.route('/SignIn', methods=['GET'])
def sign_in():
    return flask.render_template('sign_in.html')

@app.route('/SignOut', methods=['GET'])
def sign_out():
    flask.session['id'] = None
    return flask.redirect('/')

@app.route('/signin-user', methods=['POST'])
def signin_user():
    if (r:=protest_users.User.signin_user(json.loads(flask.request.form['payload'])))['status']:
        flask.session['id'] = r['user']
    
    return flask.jsonify(r)

@app.route('/add-account', methods=['POST'])
def add_account():
    if (r:=protest_users.User.add_user(json.loads(flask.request.form['payload'])))['status']:
        flask.session['id'] = r['user']
    
    return flask.jsonify(r)

@app.route('/demo/<id>/start', methods=['GET'])
def demo_start(id):
    return flask.render_template('demo_signin.html', gid = id)

@app.route('/add-invitee', methods=['POST'])
def add_invitee():
    return flask.jsonify(protest_game.GameRun.add_invitee(json.loads(flask.request.form['payload'])))

@app.route('/play/demo/<id>', methods=['GET'])
def play_demo(id):
    if (uid:=flask.request.args.get('uid')) is None or not re.findall('^\d+$', uid):
        return "<h1>404</h1>" #TODO: need 404 here
    return flask.render_template('demo_game_window.html', pld = json.dumps({'gid':int(id), 'uid':int(uid)}))

@app.route('/load-full-game-instance', methods=['POST'])
def load_full_game_instance():
    return flask.jsonify({'payload':json.dumps(protest_game.Game.load_full_game_instance(json.loads(flask.request.form['payload'])))})

@app.route('/invite-demo-players', methods=['POST'])
def invite_demo_players():
    return flask.jsonify(protest_game.GameRun.invite_demo_players(json.loads(flask.request.form['payload'])))

@app.route('/post-message', methods=['POST'])
def post_message():
    return flask.jsonify(protest_game.GameRun.post_message(json.loads(flask.request.form['payload'])))

@app.route('/assign-roles', methods=['POST'])
def assign_roles():
    return flask.jsonify(protest_game.GameRun.assign_roles(json.loads(flask.request.form['payload'])))

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    r.headers.add('Access-Control-Allow-Origin', '*')
    r.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    r.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return r

if __name__ == '__main__':
    app.debug = True
    app.run()