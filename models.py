import os

# Global in-memory database dictionary
KEY_DB = {}

def init_db():
    """Initialize the in-memory dictionary database"""
    global KEY_DB
    
    # Create company data
    companies = ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT']
    
    for company in companies:
        # Initialize with all keys set to 'True' (available)
        KEY_DB[company] = {i: 'True' for i in range(1, 55)}
    
    # Set permanently missing keys
    missing_keys = {
        'ALPHA1': [1, 3, 7, 12, 15],
        'ALPHA2': [2, 8, 11],
        'ALPHA3': [4, 9, 14, 22],
        'ALPHA4': [6, 13, 19],
        'BRAVO': [5, 17, 23, 31],
        'CHARLIE': [16, 25, 33],
        'DELTA': [21, 27, 35],
        'ECHO': [29, 37, 42],
        'FOXTROT': [32, 39, 44, 48]
    }
    
    for company, keys in missing_keys.items():
        for key in keys:
            KEY_DB[company][key] = 'Missing'
    
    print("In-memory database initialized successfully!")

def get_company_keys(company):
    """Get all keys for a specific company"""
    company = company.upper()
    if company not in KEY_DB:
        return {}
    return KEY_DB[company]

def update_key_status(company, box_id, status):
    """Update the status of a specific key"""
    try:
        company = company.upper()
        box_id = int(box_id)  # Ensure box_id is an integer
        
        # Validate status
        if status not in ['True', 'False', 'Missing']:
            print(f"Invalid status: {status}")
            return False
            
        # Check if company exists
        if company not in KEY_DB:
            print(f"Company not found: {company}")
            return False
        
        # Check if key exists
        if box_id not in KEY_DB[company]:
            print(f"Key not found: {company} - {box_id}")
            return False
            
        # Update the key status
        KEY_DB[company][box_id] = status
        
        # Log the result
        print(f"Updated {company} key {box_id} to {status}")
        return True
    except Exception as e:
        print(f"Error updating key status: {e}")
        return False 