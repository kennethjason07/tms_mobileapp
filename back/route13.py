from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/daily_expenses', methods=['POST'])
def add_daily_expense():
    try:
        # Get data from the request body
        data = request.get_json()

        # Extract fields from the JSON data
        date = data.get('Date')
        material_cost = data.get('material_cost')
        material_type = data.get('material_type')
        miscellaneous_cost = data.get('miscellaneous_Cost')
        miscellaneous_item = data.get('miscellaenous_item')
        chai_pani_cost = data.get('chai_pani_cost')
        total_pay = data.get('Total_Pay')

        # Check if mandatory fields are provided
        if not date or not total_pay:
            return jsonify({'error': 'Date and Total Pay are required fields.'}), 400

        # Create a new Daily_Expenses object
        new_expense = Daily_Expenses(
            Date=datetime.strptime(date, '%Y-%m-%d'),  # Convert string to date
            material_cost=material_cost,
            material_type=material_type,
            miscellaneous_Cost=miscellaneous_cost,
            miscellaenous_item=miscellaneous_item,
            chai_pani_cost=chai_pani_cost,
            Total_Pay=total_pay
        )

        # Add the new expense to the database
        db.session.add(new_expense)
        db.session.commit()

        # Return success message
        return jsonify({'message': 'Expense added successfully!'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
