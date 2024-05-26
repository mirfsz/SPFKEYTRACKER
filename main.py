from flask import Flask, redirect, url_for, request, render_template
import sqlite3
import pymysql.cursors
from reportGen import generateReport
app = Flask(__name__)


@app.route('/<coy>')
def index(coy: str):
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        return "Invalid URL"

    coy = coy.upper()

    with pymysql.connect('REDACTED',
                             port=0,) as con:
        with con.cursor() as cur:
            cur.execute("SELECT boxId, status FROM {}".format(coy))
            arr = cur.fetchall()

    return render_template('index.html', arr=arr, coyName=coy.upper())


@app.route('/viewTrue/<coy>')
def editTrue(coy: str):
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        return "Invalid URL"

    coy = coy.upper()

    with pymysql.connect('REDACTED',
                             port=0,) as con:
        with con.cursor() as cur:
            cur.execute("SELECT boxId, status, bunkNo FROM {}".format(coy))
            arr = cur.fetchall()

    return render_template('viewTrue.html', arr=arr, coyName=coy.upper())

@app.route('/toggleMissing/<coy>')
def toggleMissing(coy: str):
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        return "Invalid URL"

    coy = coy.upper()

    with pymysql.connect('REDACTED',
                             port=0,) as con:
        with con.cursor() as cur:
            cur.execute("SELECT boxId, status, bunkNo FROM {}".format(coy))
            arr = cur.fetchall()

    return render_template('toggleMissing.html', arr=arr, coyName=coy.upper())




@app.route('/updateStatus', methods=['POST'])
def updateStatus():
    if request.method == 'POST':
        coy = request.form['coy']
        boxId = request.form['bunk']
        status = request.form['status']

        with pymysql.connect('REDACTED',
                             port=0, ) as con:
            query = f"UPDATE {coy} SET status = %s WHERE boxId = %s"

            with con.cursor() as cur:
                cur.execute(query, (status, boxId))
                print(f"[{coy}] {boxId} | {status}")
            con.commit()

        return "True"


@app.route('/editTrueValue', methods=['POST'])
def editTrueValue():
    if request.method == 'POST':
        coy = request.form['coy']
        boxId = request.form['boxId']
        newTrueValue = request.form['newTrueValue']

        with pymysql.connect('REDACTED',
                             port=0, ) as con:
            query = f"UPDATE {coy} SET bunkNo = %s WHERE boxId = %s"

            with con.cursor() as cur:
                cur.execute(query, (newTrueValue, boxId))
                print(f"[{coy}] {boxId} | UPDATED TRUE VALUE TO {newTrueValue}")
            con.commit()

        return "True"


@app.route('/genReport', methods=['GET'])
def genReport():
    if request.method == 'GET':
        report = generateReport()

        return report

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)