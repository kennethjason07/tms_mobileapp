from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/daily_expenses', methods=['GET'])
def get_daily_expenses():
    expenses = Daily_Expenses.query.all()

    # Serialize the data for JSON response
    expenses_data = []
    for expense in expenses:
        expenses_data.append({
            'id': expense.id,
            'Date': expense.Date.strftime('%Y-%m-%d') if expense.Date else None,  # Format as string
            'material_cost': expense.material_cost,
            'material_type': expense.material_type,
            'miscellaneous_Cost': expense.miscellaneous_Cost,
            'miscellaenous_item': expense.miscellaenous_item,
            'chai_pani_cost': expense.chai_pani_cost,
            'Total_Pay': expense.Total_Pay
        })

    return jsonify(expenses_data)

if __name__ == "__main__":
    app.run(debug=True)
