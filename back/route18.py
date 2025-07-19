from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order, Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/calculate-profit', methods=['GET'])
def calculate_profit():
    try:
        date_filter = request.args.get('date')
        
        # Base query for orders
        if date_filter:
            orders = Order.query.filter(func.date(Order.updated_at) == date_filter).all()
            daily_expenses = Daily_Expenses.query.filter(func.date(Daily_Expenses.Date) == date_filter).all()
            worker_expenses = Worker_Expense.query.filter(func.date(Worker_Expense.date) == date_filter).all()
        else:
            orders = Order.query.all()
            daily_expenses = Daily_Expenses.query.all()
            worker_expenses = Worker_Expense.query.all()

        # Calculate totals
        total_revenue = sum(order.total_amt for order in orders if order.payment_status.lower() == 'paid')
        total_daily_expenses = sum((expense.material_cost or 0) + 
                                 (expense.miscellaneous_Cost or 0) + 
                                 (expense.chai_pani_cost or 0) 
                                 for expense in daily_expenses)
        total_worker_expenses = sum(expense.Amt_Paid or 0 for expense in worker_expenses)
        
        return jsonify({
            'date': date_filter or 'All Time',
            'total_revenue': round(total_revenue, 2),
            'daily_expenses': round(total_daily_expenses, 2),
            'worker_expenses': round(total_worker_expenses, 2),
            'net_profit': round(total_revenue - (total_daily_expenses + total_worker_expenses), 2)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
