import sqlite3
import datetime
import pymysql.cursors

def get_line_numbers_concat(line_nums):
    seq = []
    final = []
    last = 0

    for index, val in enumerate(line_nums):

        if last + 1 == val or index == 0:
            seq.append(val)
            last = val
        else:
            if len(seq) > 1:
               final.append(str(seq[0]) + '-' + str(seq[len(seq)-1]))
            else:
               final.append(str(seq[0]))
            seq = []
            seq.append(val)
            last = val

        if index == len(line_nums) - 1:
            if len(seq) > 1:
                final.append(str(seq[0]) + '-' + str(seq[len(seq)-1]))
            else:
                final.append(str(seq[0]))

    final_str = ', '.join(map(str, final))
    return final_str

def generateReport():

    report = ""
    # print(datetime.datetime.now().strftime("%d/%m/%Y"), datetime.datetime.today().strftime('%A') + '\n')
    report += str(datetime.datetime.now().strftime("%d/%m/%Y") + ' ' + datetime.datetime.today().strftime('%A') + '\n\n')
    with pymysql.connect('REDACTED',
                         port=0, ) as con:

        classroom = "CLASSROOM KEYS ✅"

        with con.cursor() as cur:
            cur.execute("SELECT * FROM COYINFO ORDER BY coy ASC")
            coyRes = cur.fetchall()
        for i in range(len(coyRes)):
            coy = coyRes[i][0]
            totalKeys = coyRes[i][1]

            if coy == 'ALPHA':
                alphaDrawnKeys = []
                alphaMissingKeys = []

                for h in range(1,5): #LOOP THROUGH ALPHA1 to ALPHA4
                    with con.cursor() as cur: #Get drawn keys from alpha
                        cur.execute("SELECT bunkNo FROM {} WHERE status = 'False'".format('ALPHA' + str(h)))
                        res = cur.fetchall()
                    for i in range(len(res)): #APPEND EACH BOX DK TO MAIN ALPHA DRAWNKEYS ARRAY
                        alphaDrawnKeys.append(int(res[i][0]))

                    with con.cursor() as cur: #Get missing keys from alpha
                        cur.execute("SELECT bunkNo FROM {} WHERE status = 'Missing'".format('ALPHA' + str(h)))
                        res = cur.fetchall()

                    for i in range(len(res)): #APPEND EACH BOX MISSING TO MAIN ALPHA MISSING ARRAY
                        alphaMissingKeys.append(int(res[i][0]))

                alphaDrawnKeysText = get_line_numbers_concat(alphaDrawnKeys)
                alphaMissingKeysText = get_line_numbers_concat(alphaMissingKeys)
                alphaHoldingKeyQty = totalKeys - len(alphaMissingKeys) - len(alphaDrawnKeys)
                report += f"""ALPHA - {totalKeys} keys in total ✅\nCurrently holding: {alphaHoldingKeyQty} keys\nDrawn: {alphaDrawnKeysText} ({len(alphaDrawnKeys)} keys)\nMissing: {alphaMissingKeysText} ({len(alphaMissingKeys)} keys)\n\n"""
            else:
                with con.cursor() as cur:
                    cur.execute("SELECT bunkNo FROM {} WHERE status = 'False'".format(coy))
                    res = cur.fetchall()
                drawnKeys = []
                for i in range(len(res)):
                    drawnKeys.append(int(res[i][0]))

                classKeyDrawnCount = 0
                if 'ALPHA' not in coy:
                    for x, y in enumerate([52, 53, 54], start=2):
                        type = "cr"
                        if x == 2 and coy in ['CHARLIE', 'DELTA', 'ECHO']:
                            type = "rec room"
                        if y in drawnKeys:
                            classroom += f"\n{coy.capitalize()} lvl {x} {type} - not returned"
                            classKeyDrawnCount -= 1
                        else:
                            classroom += f"\n{coy.capitalize()} lvl {x} {type} - returned"
                if classKeyDrawnCount < 0:
                    del drawnKeys[classKeyDrawnCount:]
                drawnKeysText = get_line_numbers_concat(drawnKeys)

                with con.cursor() as cur:
                    cur.execute("SELECT bunkNo FROM {} WHERE status = 'Missing'".format(coy))
                    res = cur.fetchall()

                missingKeys = []
                for i in range(len(res)):
                    missingKeys.append(int(res[i][0]))
                missingKeysText = get_line_numbers_concat(missingKeys)

                holdingKeyQty = totalKeys - len(missingKeys) - len(drawnKeys)
                report += f"""{coy} - {totalKeys} keys in total ✅\nCurrently holding: {holdingKeyQty} keys\nDrawn: {drawnKeysText} ({len(drawnKeys)} keys)\nMissing: {missingKeysText} ({len(missingKeys)} keys)\n\n"""
                # print(f"""{coy} - {totalKeys} keys in total ✅\nCurrently holding: {holdingKeyQty} keys\nDrawn: {drawnKeysText} ({len(drawnKeys)} keys)\nMissing: {missingKeysText} ({len(missingKeys)} keys)\n""")
        report += classroom
        # print(classroom)

    return report
