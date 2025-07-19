from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.get_json()
        status = data.get('status')

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        order.status = status
        db.session.commit()

        return jsonify({'message': 'Order status updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
