from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/weekly-pay/<int:worker_id>', methods=['GET'])
def calculate_weekly_pay(worker_id):
    try:
        # Get the date for 7 days ago
        one_week_ago = datetime.now() - timedelta(days=7)
        
        # Fetch the worker's rate from the Worker table
        worker = db.session.query(Worker).get(worker_id)
        
        if not worker:
            return jsonify({'error': 'Worker not found'}), 404

        # Query all orders associated with the worker in the last 7 days
        total_orders = db.session.query(Order).join(
            order_worker_association, Order.id == order_worker_association.c.order_id
        ).filter(
            order_worker_association.c.worker_id == worker_id,
            Order.order_date >= one_week_ago
        ).all()
        
        # Calculate the total worker pay based on the number of orders and worker's rate
        total_worker_pay = len(total_orders) * (worker.Rate or 0)

        # Fetch and sum the 'Amt_Paid' from 'Worker_Expense' for the last 7 days for the given worker
        total_amt_paid = db.session.query(func.sum(Worker_Expense.Amt_Paid)).filter(
            Worker_Expense.worker_id == worker_id,
            Worker_Expense.date >= one_week_ago
        ).scalar() or 0  # default to 0 if no records

        # Calculate remaining pay (worker pay - expenses)
        remaining_pay = total_worker_pay - total_amt_paid

        return jsonify({
            'worker_id': worker_id,
            'total_worker_pay': total_worker_pay,
            'total_amt_paid': total_amt_paid,
            'remaining_pay': remaining_pay
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
