from flask import Flask, redirect, url_for, request, render_template, jsonify, send_from_directory
from flask_cors import CORS
from reportGen import generateReport
from models import init_db, get_company_keys, update_key_status
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
# Enable CORS for all routes with proper configuration for cross-origin requests
CORS(app, origins="*")  # Allow all origins

# Initialize database on startup
init_db()

@app.route('/api/health')
def health_check():
    """Health check endpoint for Render"""
    print("Health check endpoint called")
    return jsonify({"status": "healthy"}), 200

# Original route kept for backward compatibility
@app.route('/')
def serve():
    """Redirect to legacy UI as we're now using a separate static site for React"""
    return redirect(url_for('index', coy='alpha1'))

@app.route('/api/keys/<coy>')
def get_keys(coy):
    """API endpoint to get all keys for a company"""
    print(f"Fetching keys for company: {coy}")
    coys = ['alpha1', 'alpha2', 'alpha3', 'alpha4', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
    if coy.lower() not in coys:
        print(f"Invalid company: {coy}")
        return jsonify({"error": "Invalid company"}), 400

    try:
        keys = get_company_keys(coy.upper())
        print(f"Found {len(keys)} keys for {coy}")
        response = jsonify(keys)
        return response
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
    else:
        # Try to handle with React
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except:
            # Fall back to Flask template
            return render_template('404.html'), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    print("\n✅ KeyTracker API started successfully!")
    print("✅ Made by 197 OBIC Irfan Mirzan - PayNow: 84810703")
    print(f"✅ Access the API at: http://localhost:{port}/api\n")
    print(f"✅ For legacy UI, visit: http://localhost:{port}/alpha1\n")
    app.run(host='0.0.0.0', port=port, debug=os.environ.get("FLASK_ENV") == "development")