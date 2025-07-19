from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/orders/<int:order_id>/update-total-amount', methods=['POST'])
def update_total_amount(order_id):
    try:
        # Get the request data
        data = request.get_json()
        new_total_amt = data.get('total_amt')

        # Validate the input
        if new_total_amt is None or new_total_amt < 0:
            return jsonify({'error': 'Invalid total amount provided'}), 400

        # Fetch the order by ID
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        # Update the total_amt field
        order.total_amt = new_total_amt
        db.session.commit()

        return jsonify({'message': 'Total amount updated successfully', 'total_amt': order.total_amt}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
