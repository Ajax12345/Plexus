import flask

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return "<h1>coming soon</h1>"

if __name__ == '__main__':
    app.debug = True
    app.run()