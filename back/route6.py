from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/orders/<int:order_id>/payment-mode', methods=['PUT']) 
def update_payment_mode(order_id):
    try:
        data = request.get_json()  # Corrected typo from 'reques' to 'request'
        payment_mode = data.get('payment_mode')

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order Not Found'}), 404

        order.payment_mode = payment_mode
        db.session.commit()

        return jsonify({'message': 'Payment Mode Updated Successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
