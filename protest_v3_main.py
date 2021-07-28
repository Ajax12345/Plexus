import flask

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return flask.render_template('demo_landing.html')

@app.route('/dashboard', methods=['GET'])
def dashboard():
    return flask.redirect('/dashboard/games')

@app.route('/dashboard/games', methods=['GET'])
def dashboard_games():
    return flask.render_template('dashboard.html')

@app.route('/dashboard/content', methods=['GET'])
def dashboard_content():
    return flask.render_template('dashboard_content.html')

@app.route('/dashboard/matrices', methods=['GET'])
def dashboard_matrices():
    return flask.render_template('dashboard_matrices.html')

@app.route('/dashboard-onboard', methods=['GET'])
def dashboard_onboard():
    return flask.render_template('dashboard_onboard.html')

#TODO: convert /create-<resource> to /create/<resource>
@app.route('/create-game', methods=['GET'])
def create_game():
    return flask.render_template('create_game.html')

@app.route('/create-game-2', methods=['GET'])
def create_game_2():
    return flask.render_template('create_game_2.html')

@app.route('/create-game-3', methods=['GET'])
def create_game_3():
    return flask.render_template('create_game_3.html')

@app.route('/create-content', methods=['GET'])
def create_content():
    return flask.render_template('create_content_1.html')

@app.route('/create-content-2', methods=['GET'])
def create_content_2():
    return flask.render_template('create_content_2.html')

@app.route('/create-matrix', methods=['GET'])
def create_matrix():
    return flask.render_template('create_matrix.html')

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

@app.route('/game/testgame', methods=['GET'])
def game_dashboard():
    return flask.render_template('game_dashboard.html')

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