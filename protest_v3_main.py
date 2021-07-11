import flask

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return flask.render_template('demo_landing.html')

if __name__ == '__main__':
    app.debug = True
    app.run()