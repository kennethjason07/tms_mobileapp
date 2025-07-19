from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func, desc

# Route for customer info section

@app.route('/api/customer-info/<mobile_number>', methods=['GET', 'PUT'])
def get_customer_info(mobile_number):
    try:
        # Fetch measurements for the customer
        measurements = Measurement.query.filter_by(phone_number=mobile_number).first()
        if not measurements:
            return jsonify({"error": "No measurements found for this customer"}), 404

        # Fetch related bills and iterate their orders
        customer_bills = Bill.query.filter_by(mobile_number=mobile_number).all()
        if not customer_bills:
            return jsonify({"error": "No bills found for this customer"}), 404

        order_history = []
        for bill in customer_bills:
            for order in bill.orders:
                order_history.append(order.as_dict())
        
        # Sort orders by order_date in descending order (newest first)
        order_history.sort(key=lambda x: x.get('id', ''), reverse=True)

        customer_info = {
            "measurements": measurements.as_dict() if measurements else None,
            "order_history": order_history,
            "customer_name": customer_bills[0].customer_name,
            "mobile_number": mobile_number
        }

        if request.method == 'PUT':
            # Update measurements
            data = request.get_json()
            for key, value in data.items():
                if hasattr(measurements, key):
                    setattr(measurements, key, value)
            db.session.commit()
            return jsonify({"message": "Measurements updated successfully"}), 200

        return jsonify(customer_info), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
