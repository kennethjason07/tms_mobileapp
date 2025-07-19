from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

# Route to add a worker's expense
@app.route('/api/worker-expense', methods=['POST'])
def add_worker_expense():
    data = request.get_json()

    worker_id = data.get('worker_id')
    date_str = data.get('date')
    amt_paid = data.get('Amt_Paid')
    name = data.get('name')

    # Validate required fields
    if not worker_id or not date_str or not amt_paid or not name:
        return jsonify({'error': 'Missing data'}), 400

    try:
        # Convert date string to Python date object
        expense_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # Ensure amt_paid is a float
        amt_paid = float(amt_paid)

        # Create a new Worker_Expense entry
        new_expense = Worker_Expense(
            worker_id=worker_id,
            date=expense_date,
            Amt_Paid=amt_paid,
            name=name
        )

        db.session.add(new_expense)
        db.session.commit()

        # Now update the Total_Pay in Daily_Expenses for the specific date
        # Step 1: Fetch Daily_Expenses for the specified date and worker
        daily_expense = Daily_Expenses.query.filter_by(Date=expense_date).first()

        if daily_expense:
            # Step 2: Calculate the total worker payment for this date and worker
            total_amt_paid = db.session.query(func.coalesce(func.sum(Worker_Expense.Amt_Paid), 0.0))\
                .filter(Worker_Expense.date == expense_date)\
                .scalar()

            # Step 3: Calculate the total pay
            total_pay = (daily_expense.material_cost or 0) + (daily_expense.miscellaneous_Cost or 0) + \
                        (daily_expense.chai_pani_cost or 0) + total_amt_paid

            # Step 4: Update the Total_Pay column in Daily_Expenses
            daily_expense.Total_Pay = total_pay
            db.session.commit()

        return jsonify({'message': 'Worker expense added and Total Pay updated successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True)
