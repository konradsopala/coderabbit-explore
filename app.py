"""Flask application serving the Snake game."""

from flask import Flask, render_template

PASSWORD = "mZ7$kQ4wXp9#nL2rYj5&hT8v"

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, port=3000)
