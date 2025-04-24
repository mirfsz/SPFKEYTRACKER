import datetime
import sqlite3
from models import get_db_connection

def get_line_numbers_concat(line_nums):
    """
    Compress a list of numbers into a human-friendly range string
    e.g. [1,2,3,5,7,8,9] becomes "1-3, 5, 7-9"
    """
    if not line_nums:
        return "None"
        
    # Sort the numbers to ensure proper grouping
    line_nums = sorted(line_nums)
    
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
    """
    Generate a formatted report of key status across all companies
    """
    # Format date in the required format
    today = datetime.datetime.now()
    report = "Key Status Report\n"
    report += f"Date: {today.strftime('%d %b %Y')}\n"
    report += f"Day: {today.strftime('%A')}\n\n"
    
    try:
        # Connect to SQLite database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all companies in specified order
        companies = ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT']
        
        # Process each company
        for coy in companies:
            # Get total keys for this company
            totalKeys = 54
            
            # Initialize lists
            drawn_keys = []
            missing_keys = []
            classroom_keys_drawn = []
            
            # Query the database for key statuses
            cursor.execute(f"SELECT boxId, status FROM {coy}")
            results = cursor.fetchall()
            
            # Process the results
            for row in results:
                boxId = row['boxId']
                status = row['status']
                
                if status == 'False':  # Red = Drawn
                    drawn_keys.append(boxId)
                    # Check if this is a classroom key (51-54)
                    if 51 <= boxId <= 54:
                        level = boxId - 50  # Convert to level number
                        classroom_keys_drawn.append(f"• Level {level} classroom")
                elif status == 'Missing':  # Grey = Missing
                    missing_keys.append(boxId)
            
            # Calculate holding keys (Present/Green)
            holding_keys = totalKeys - len(drawn_keys) - len(missing_keys)
            
            # Generate the report text for this company
            report += f"{coy} – {totalKeys} keys in total ✅\n"
            report += f"Currently holding: {holding_keys} keys\n"
            report += f"Drawn: {get_line_numbers_concat(drawn_keys)} ({len(drawn_keys)} keys)\n"
            report += f"Missing: {get_line_numbers_concat(missing_keys)} ({len(missing_keys)} keys)\n"
            
            # Add classroom keys section if any are drawn
            if classroom_keys_drawn:
                report += "Classroom keys drawn:\n"
                for key in sorted(classroom_keys_drawn):
                    report += f"{key}\n"
            
            report += "\n"
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        print(f"Database error in report generation: {e}")
        # Create mock data for testing
        report += "MOCK REPORT FOR TESTING (No Database Connection)\n\n"
        
        # Mock data for testing
        mock_data = {
            'ALPHA1': {
                'holding': 42,
                'drawn': [2, 6, 12, 13, 23, 26, 34],
                'missing': [1, 3, 7, 15],
                'classroom_drawn': [51]
            },
            'ALPHA2': {
                'holding': 41,
                'drawn': [1, 4, 13, 14, 26, 29, 30, 37, 40, 46],
                'missing': [2, 8, 11],
                'classroom_drawn': []
            },
            'ALPHA3': {
                'holding': 41,
                'drawn': [14, 17, 18, 20, 39, 42, 48],
                'missing': [4, 9, 22],
                'classroom_drawn': [52, 54]
            },
            'ALPHA4': {
                'holding': 42,
                'drawn': [1, 3, 6, 8, 12, 14, 18, 29, 47],
                'missing': [13, 19],
                'classroom_drawn': []
            },
            'BRAVO': {
                'holding': 38,
                'drawn': [1, 4, 13, 14, 26, 29, 30, 37, 40, 46],
                'missing': [5, 17, 23, 31],
                'classroom_drawn': [51, 53]
            },
            'CHARLIE': {
                'holding': 41,
                'drawn': [14, 17, 18, 20, 39, 42, 48],
                'missing': [16, 25, 33],
                'classroom_drawn': [52]
            },
            'DELTA': {
                'holding': 40,
                'drawn': [1, 3, 6, 8, 12, 14, 18, 29, 47],
                'missing': [21, 27, 35],
                'classroom_drawn': [51, 54]
            },
            'ECHO': {
                'holding': 43,
                'drawn': [1, 13, 18, 36, 38, 40, 41, 47],
                'missing': [29, 37, 42],
                'classroom_drawn': []
            },
            'FOXTROT': {
                'holding': 45,
                'drawn': [4, 5, 14, 20, 24, 31, 39, 49],
                'missing': [32, 44, 48],
                'classroom_drawn': [52, 53]
            }
        }
        
        for coy, data in mock_data.items():
            total = 54
            report += f"{coy} – {total} keys in total ✅\n"
            report += f"Currently holding: {data['holding']} keys\n"
            report += f"Drawn: {get_line_numbers_concat(data['drawn'])} ({len(data['drawn'])} keys)\n"
            report += f"Missing: {get_line_numbers_concat(data['missing'])} ({len(data['missing'])} keys)\n"
            
            if data['classroom_drawn']:
                report += "Classroom keys drawn:\n"
                for key in sorted(data['classroom_drawn']):
                    level = key - 50  # Convert to level number
                    report += f"• Level {level} classroom\n"
            
            report += "\n"

    return report
