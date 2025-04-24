import sqlite3
import os
import json

def get_db_connection():
    """Create a connection to the SQLite database"""
    db_path = os.environ.get('DATABASE_URL', 'keys.db')
    
    # If a Postgres URL is provided, fall back to SQLite
    if db_path.startswith('postgres'):
        db_path = 'keys.db'
        
    # Ensure the directory exists for the database
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database if it doesn't exist or is empty"""
    db_path = os.environ.get('DATABASE_URL', 'keys.db')
    
    # If a Postgres URL is provided, fall back to SQLite
    if db_path.startswith('postgres'):
        db_path = 'keys.db'
        
    if os.path.exists(db_path):
        # Check if the database has tables
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        if len(tables) > 0:
            conn.close()
            return
        conn.close()
    
    # Create the database and tables
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create company tables
    companies = ['ALPHA1', 'ALPHA2', 'ALPHA3', 'ALPHA4', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT']
    
    for company in companies:
        cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {company} (
            boxId INTEGER PRIMARY KEY,
            status TEXT CHECK(status IN ('True', 'False', 'Missing')) DEFAULT 'True'
        )
        ''')
        
        # Populate with initial data (54 keys per company)
        for i in range(1, 55):
            cursor.execute(f"INSERT INTO {company} (boxId, status) VALUES (?, 'True')", (i,))
    
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
            cursor.execute(f"UPDATE {company} SET status = 'Missing' WHERE boxId = ?", (key,))
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def get_company_keys(company):
    """Get all keys for a specific company"""
    company = company.upper()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT boxId, status FROM {company}")
    keys = {row['boxId']: row['status'] for row in cursor.fetchall()}
    conn.close()
    return keys

def update_key_status(company, box_id, status):
    """Update the status of a specific key"""
    try:
        company = company.upper()
        box_id = int(box_id)  # Ensure box_id is an integer
        
        # Validate status
        if status not in ['True', 'False', 'Missing']:
            print(f"Invalid status: {status}")
            return False
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the key exists first
        cursor.execute(f"SELECT COUNT(*) FROM {company} WHERE boxId = ?", (box_id,))
        if cursor.fetchone()[0] == 0:
            print(f"Key not found: {company} - {box_id}")
            conn.close()
            return False
            
        # Update the key status
        cursor.execute(f"UPDATE {company} SET status = ? WHERE boxId = ?", (status, box_id))
        conn.commit()
        
        # Verify the update was successful
        cursor.execute(f"SELECT status FROM {company} WHERE boxId = ?", (box_id,))
        updated_status = cursor.fetchone()['status']
        conn.close()
        
        # Log the result
        print(f"Updated {company} key {box_id} to {status}, result: {updated_status}")
        return updated_status == status
    except Exception as e:
        print(f"Error updating key status: {e}")
        return False 