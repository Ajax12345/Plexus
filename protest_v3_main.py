import flask

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return flask.render_template('game_window_v3_1.html')

if __name__ == '__main__':
    app.debug = True
    app.run()