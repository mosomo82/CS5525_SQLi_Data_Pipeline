from flask import Flask, request, jsonify, render_template_string
import mysql.connector

app = Flask(__name__)

DB_CONFIG = {
    'host': 'sqli-project-db.czyk0ug66bse.us-east-2.rds.amazonaws.com',
    'user': 'admin',
    'password': 'SQLi_Project_2024!',
    'database': 'userdata'
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

@app.route('/')
def home():
    return '''
    <h1>Vulnerable Search Application</h1>
    <p>Welcome to the SQL Injection Demo App</p>
    <h2>Search Users:</h2>
    <form action="/search" method="GET">
        <input type="text" name="name" placeholder="Enter name to search" required>
        <button type="submit">Search</button>
    </form>
    <p><strong>Example:</strong> <a href="/search?name=John">Search for "John"</a></p>
    '''

@app.route('/login')
def login():
    username = request.args.get('username', '')
    password = request.args.get('password', '')
    db = get_db()
    cursor = db.cursor(dictionary=True)
    query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'"
    cursor.execute(query)
    result = cursor.fetchall()
    db.close()
    return jsonify({'query': query, 'results': result})

@app.route('/search')
def search():
    name = request.args.get('name', '')
    db = get_db()
    cursor = db.cursor(dictionary=True)
    query = "SELECT id, full_name, email FROM users WHERE full_name LIKE '%" + name + "%'"
    cursor.execute(query)
    result = cursor.fetchall()
    db.close()
    return jsonify({'query': query, 'results': result})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
