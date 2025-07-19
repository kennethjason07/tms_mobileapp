from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/worker-expenses', methods=['GET'])
def get_worker_expenses():
    try:
        # Query all expenses from the Worker_Expense table
        expenses = Worker_Expense.query.all()

        # Convert each expense record to a dictionary format for JSON response
        expenses_data = [{
            'id': expense.id,
            'date': expense.date.strftime('%Y-%m-%d'),
            'name': expense.name,
            'Amt_Paid': expense.Amt_Paid,
            'worker_id': expense.worker_id
        } for expense in expenses]

        # Return the data as JSON
        return jsonify(expenses_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
