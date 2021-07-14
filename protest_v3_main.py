import flask

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return flask.render_template('demo_landing.html')

@app.route('/create-game', methods=['GET'])
def create_game():
    return flask.render_template('create_game.html')

@app.route('/create-game-2', methods=['GET'])
def create_game_2():
    return flask.render_template('create_game_2.html')

@app.route('/create-game-3', methods=['GET'])
def create_game_3():
    return flask.render_template('create_game_3.html')

@app.route('/first-player-game-window', methods=['GET'])
def first_player_game_window():
    return flask.render_template('game_window_v3.html')

@app.route('/second-player-game-window', methods=['GET'])
def second_player_game_window():
    return flask.render_template('game_window_v3_1.html')

@app.route('/third-player-game-window', methods=['GET'])
def third_player_game_window():
    return flask.render_template('game_window_v3_2.html')

@app.route('/instructor-player-game-window', methods=['GET'])
def instructor_player_game_window():
    return flask.render_template('game_window_v3_3.html')

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