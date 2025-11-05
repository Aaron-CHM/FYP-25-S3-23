from flask import Flask, render_template, request, jsonify, session, send_file, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from db_config import DatabaseConnection
import os
from datetime import datetime
import uuid

from werkzeug.security import generate_password_hash
print(generate_password_hash('admin123'))


app = Flask(__name__, 
            static_folder='statics',
            static_url_path='/static',
            template_folder='templates')

app.secret_key = 'your_secret_key_here_change_in_production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['AVATARS_FOLDER'] = 'static/avatars'
app.config['ANIMATIONS_FOLDER'] = 'static/animations'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['AVATARS_FOLDER'], exist_ok=True)
os.makedirs(app.config['ANIMATIONS_FOLDER'], exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_db():
    return DatabaseConnection().get_connection()

# ============================================
# MAIN ROUTES (HTML Pages)
# ============================================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/user')
def user_dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    if session.get('role') not in ['user', 'subscriber', 'admin']:
        return redirect(url_for('login_page'))
    return render_template('user.html')

@app.route('/subscriber')
def subscriber_dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    if session.get('role') not in ['subscriber', 'admin']:
        return redirect(url_for('login_page'))
    return render_template('subscriber.html')

@app.route('/admin')
def admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('login_page'))
    return render_template('admin.html')

# ============================================
# API ENDPOINTS
# ============================================
@app.route('/api/signup', methods=['POST'])
def api_signup():
    try:
        data = request.get_json()
        fullname = data.get('fullname')
        email = data.get('email')
        password = data.get('password')
        
        if not all([fullname, email, password]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Check if email exists
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            db.close()
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Insert new user
        hashed_password = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (fullname, email, password, role) VALUES (%s, %s, %s, %s)",
            (fullname, email, hashed_password, 'user')
        )
        db.commit()
        cursor.close()
        db.close()
        
        return jsonify({'success': True, 'message': 'Account created successfully'})
    
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        cursor.close()
        db.close()
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Create session
        session['user_id'] = user['user_id']
        session['email'] = user['email']
        session['fullname'] = user['fullname']
        session['role'] = user['role']
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'role': user['role'],
            'redirect': url_for(f'{user["role"]}_dashboard') if user['role'] != 'user' else url_for('user_dashboard')
        })
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/profile', methods=['GET', 'PUT'])
def api_profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        if request.method == 'GET':
            cursor.execute("SELECT user_id, fullname, email, role, subscription_status FROM users WHERE user_id = %s", 
                         (session['user_id'],))
            user = cursor.fetchone()
            return jsonify({'success': True, 'user': user})
        
        elif request.method == 'PUT':
            data = request.get_json()
            fullname = data.get('fullname')
            email = data.get('email')
            
            cursor.execute(
                "UPDATE users SET fullname = %s, email = %s WHERE user_id = %s",
                (fullname, email, session['user_id'])
            )
            db.commit()
            
            session['fullname'] = fullname
            session['email'] = email
            
            return jsonify({'success': True, 'message': 'Profile updated'})
    
    except Exception as e:
        print(f"Profile error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/avatar/upload', methods=['POST'])
def upload_avatar():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['avatar']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if file and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        filepath = os.path.join(app.config['AVATARS_FOLDER'], filename)
        file.save(filepath)
        
        db = get_db()
        cursor = db.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO avatars (user_id, avatar_path) VALUES (%s, %s)",
                (session['user_id'], f'avatars/{filename}')
            )
            db.commit()
            
            avatar_id = cursor.lastrowid
            
            return jsonify({
                'success': True,
                'message': 'Avatar uploaded successfully',
                'avatar_id': avatar_id,
                'avatar_path': f'avatars/{filename}'
            })
        
        except Exception as e:
            print(f"Avatar upload error: {e}")
            return jsonify({'success': False, 'message': str(e)}), 500
        finally:
            cursor.close()
            db.close()
    
    return jsonify({'success': False, 'message': 'Invalid file type'}), 400

@app.route('/api/avatars', methods=['GET'])
def get_avatars():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        if session.get('role') == 'admin':
            cursor.execute("SELECT * FROM avatars ORDER BY created_at DESC")
        else:
            cursor.execute("SELECT * FROM avatars WHERE user_id = %s ORDER BY created_at DESC", 
                         (session['user_id'],))
        
        avatars = cursor.fetchall()
        return jsonify({'success': True, 'avatars': avatars})
    
    except Exception as e:
        print(f"Get avatars error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/avatar/<int:avatar_id>', methods=['DELETE'])
def delete_avatar(avatar_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM avatars WHERE avatar_id = %s AND user_id = %s", 
                     (avatar_id, session['user_id']))
        avatar = cursor.fetchone()
        
        if not avatar:
            return jsonify({'success': False, 'message': 'Avatar not found'}), 404
        
        filepath = os.path.join('static', avatar['avatar_path'])
        if os.path.exists(filepath):
            os.remove(filepath)
        
        cursor.execute("DELETE FROM avatars WHERE avatar_id = %s", (avatar_id,))
        db.commit()
        
        return jsonify({'success': True, 'message': 'Avatar deleted'})
    
    except Exception as e:
        print(f"Delete avatar error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/expressions', methods=['GET'])
def get_expressions():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM expressions ORDER BY expression_name")
        expressions = cursor.fetchall()
        return jsonify({'success': True, 'expressions': expressions})
    
    except Exception as e:
        print(f"Get expressions error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/animation/generate', methods=['POST'])
def generate_animation():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    avatar_id = data.get('avatar_id')
    expression_id = data.get('expression_id')
    
    if not all([avatar_id, expression_id]):
        return jsonify({'success': False, 'message': 'Avatar and expression required'}), 400
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        animation_path = f'animations/animation_{uuid.uuid4()}.mp4'
        
        cursor.execute(
            "INSERT INTO animations (user_id, avatar_id, expression_id, animation_path, status) VALUES (%s, %s, %s, %s, %s)",
            (session['user_id'], avatar_id, expression_id, animation_path, 'processing')
        )
        db.commit()
        
        animation_id = cursor.lastrowid
        
        # TODO: Call First Order Model processing here
        cursor.execute("UPDATE animations SET status = %s WHERE animation_id = %s", 
                     ('completed', animation_id))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Animation generated',
            'animation_id': animation_id,
            'animation_path': animation_path
        })
    
    except Exception as e:
        print(f"Generate animation error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/animations', methods=['GET'])
def get_animations():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT a.*, av.avatar_path, e.expression_name 
            FROM animations a
            JOIN avatars av ON a.avatar_id = av.avatar_id
            LEFT JOIN expressions e ON a.expression_id = e.expression_id
            WHERE a.user_id = %s
            ORDER BY a.created_at DESC
        """, (session['user_id'],))
        
        animations = cursor.fetchall()
        return jsonify({'success': True, 'animations': animations})
    
    except Exception as e:
        print(f"Get animations error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/subscription/update', methods=['POST'])
def update_subscription():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    plan = data.get('plan')
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        cursor.execute(
            "UPDATE users SET role = %s, subscription_status = %s WHERE user_id = %s",
            ('subscriber', 'active', session['user_id'])
        )
        db.commit()
        
        session['role'] = 'subscriber'
        
        return jsonify({'success': True, 'message': 'Subscription updated'})
    
    except Exception as e:
        print(f"Update subscription error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT user_id, fullname, email, role, subscription_status, created_at FROM users")
        users = cursor.fetchall()
        return jsonify({'success': True, 'users': users})
    
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/admin/user/<int:user_id>', methods=['PUT', 'DELETE'])
def admin_manage_user(user_id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    db = get_db()
    cursor = db.cursor()
    
    try:
        if request.method == 'PUT':
            data = request.get_json()
            action = data.get('action')
            
            if action == 'suspend':
                cursor.execute("UPDATE users SET subscription_status = %s WHERE user_id = %s", 
                             ('suspended', user_id))
            elif action == 'activate':
                cursor.execute("UPDATE users SET subscription_status = %s WHERE user_id = %s", 
                             ('active', user_id))
            
            db.commit()
            return jsonify({'success': True, 'message': 'User updated'})
        
        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
            db.commit()
            return jsonify({'success': True, 'message': 'User deleted'})
    
    except Exception as e:
        print(f"Manage user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Face Animation Platform Starting...")
    print("="*60)
    print(f"Server running at: http://localhost:5000")
    print(f"Static folder: {app.static_folder}")
    print(f"Template folder: {app.template_folder}")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')