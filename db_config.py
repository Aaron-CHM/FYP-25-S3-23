import mysql.connector
from mysql.connector import Error

class DatabaseConnection:
    def __init__(self):
        """Initialize database connection"""
        try:
            self.connection = mysql.connector.connect(
                host="localhost",
                user="root",  # Change to your MySQL username
                password="1234",  # Change to your MySQL password
                database="face_animation_db"
            )
            
            if self.connection.is_connected():
                print("Successfully connected to MySQL database")
        
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            self.connection = None
    
    def get_connection(self):
        """Return the database connection"""
        if self.connection and self.connection.is_connected():
            return self.connection
        else:
            # Reconnect if connection was lost
            self.__init__()
            return self.connection
    
    def close(self):
        """Close the database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("MySQL connection closed")