import datetime
from models import KEY_DB

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
            
            # Check if company data exists
            if coy not in KEY_DB:
                continue
                
            # Get key statuses from in-memory database
            keys_data = KEY_DB[coy]
            
            # Process the results
            for boxId, status in keys_data.items():
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
        
    except Exception as e:
        print(f"Error in report generation: {e}")
        report += f"Error generating report: {str(e)}\n"

    return report
