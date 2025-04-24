from flask import Flask, redirect, url_for, request, render_template, jsonify
from flask_cors import CORS
from reportGen import generateReport
from models import init_db, get_company_keys, update_key_status
import os

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Initialize database on startup
init_db()

@app.route('/')
def serve():
    """Serve the React frontend if it exists, otherwise redirect to ALPHA1"""
    if os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return app.send_static_file('index.html')
    else:
        # If React build doesn't exist, fall back to legacy Flask templates
        return redirect(url_for('index', coy='alpha1'))

@app.route('/api/keys/<coy>')
def get_keys(coy):
    """API endpoint to get all keys for a company"""
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        return jsonify({"error": "Invalid company"}), 400

    try:
        keys = get_company_keys(coy.upper())
        return jsonify(keys)
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/keys/<coy>/<box_id>', methods=['POST'])
def update_key(coy, box_id):
    """API endpoint to update a key's status"""
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        return jsonify({"error": "Invalid company"}), 400

    try:
        data = request.json
        status = data.get('status')
        if status not in ['True', 'False', 'Missing']:
            return jsonify({"error": "Invalid status"}), 400

        # Check if key is permanently missing
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
        
        if int(box_id) in missing_keys.get(coy.upper(), []):
            return jsonify({"error": "Cannot update permanently missing key"}), 400

        result = update_key_status(coy.upper(), box_id, status)
        return jsonify({"success": result})
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/report', methods=['GET'])
def gen_report():
    """API endpoint to generate a report"""
    try:
        report = generateReport()
        return jsonify({"report": report})
    except Exception as e:
        print(f"Report generation error: {e}")
        return jsonify({"error": str(e)}), 500

# Legacy routes for backward compatibility
@app.route('/<coy>')
def index(coy):
    """Legacy endpoint for the original UI"""
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        return render_template('404.html'), 404

    try:
        keys = get_company_keys(coy.upper())
        # Convert to the format expected by the template
        arr = [{"boxId": k, "status": v} for k, v in keys.items()]
        arr.sort(key=lambda x: x["boxId"])
        return render_template('index.html', arr=arr, coyName=coy.upper())
    except Exception as e:
        print(f"Database error: {e}")
        # For testing purposes - create dummy data if database connection fails
        arr = [{'boxId': i, 'status': 'True'} for i in range(1, 55)]
        
        # Set permanently missing keys based on the company
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
        
        coy = coy.upper()
        if coy in missing_keys:
            for i in missing_keys[coy]:
                if i-1 < len(arr):
                    arr[i-1]['status'] = 'Missing'

        return render_template('index.html', arr=arr, coyName=coy)

@app.route('/updateStatus', methods=['POST'])
def updateStatus():
    """Legacy endpoint to update key status"""
    if request.method == 'POST':
        try:
            coy = request.form['coy']
            boxId = request.form['bunk']
            status = request.form['status']
            
            print(f"Updating key: {coy} - {boxId} to {status}")
            
            # Validate status
            if status not in ['True', 'False', 'Missing']:
                return "Invalid status", 400
                
            result = update_key_status(coy, boxId, status)
            if result:
                return "True"
            else:
                return "Error: Failed to update database", 500
        except Exception as e:
            print(f"Database error: {e}")
            return f"Error: {str(e)}", 500

@app.route('/genReport', methods=['GET'])
def genReport():
    """Legacy endpoint to generate a report"""
    if request.method == 'GET':
        try:
            report = generateReport()
            # Set content type to plain text for easier clipboard handling
            return report, {'Content-Type': 'text/plain'}
        except Exception as e:
            print(f"Report generation error: {e}")
            return f"Error generating report: {str(e)}", 500

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors by serving React for client-side routing or Flask template"""
    if request.path.startswith('/api/'):
        # API routes should return JSON error
        return jsonify({"error": "Not found"}), 404
    elif os.path.exists(os.path.join(app.static_folder, 'index.html')):
        # Try to handle with React
        return app.send_static_file('index.html')
    else:
        # Fall back to Flask template
        return render_template('404.html'), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    print("\n✅ KeyTracker started successfully!")
    print("✅ Made by 197 OBIC Irfan Mirzan - PayNow: 84810703")
    print(f"✅ Access the application at: http://localhost:{port}\n")
    print(f"✅ If you have the React frontend built, visit: http://localhost:{port}\n")
    print(f"✅ For legacy UI, visit: http://localhost:{port}/alpha1\n")
    app.run(host='0.0.0.0', port=port, debug=os.environ.get("FLASK_ENV") == "development")