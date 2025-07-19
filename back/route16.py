from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func
from sqlalchemy import and_


@app.route('/api/hello', methods=['GET'])
def get_orders_for_worker():
    try:
        # Get the worker_id from query parameters
        worker_id = request.args.get('worker_id', type=int)
        if worker_id is None:
            return jsonify({'error': 'Worker ID is required'}), 400

        # Step 1: Check if the worker exists
        worker = Worker.query.get(worker_id)
        if not worker:
            return jsonify({'error': f"Worker with ID {worker_id} not found"}), 404

        # Step 2: Retrieve all orders for the specified worker_id through the many-to-many relationship
        orders = Order.query.join(Order.workers).filter(Worker.id == worker_id).all()

        # Step 3: Check if orders were found
        if not orders:
            return jsonify({'error': f"No orders found for worker with ID {worker_id}"}), 404

        # Prepare the JSON response with order details and assigned workers
        orders_data = [{
            'id': order.id,
            'garment_type': order.garment_type,
            'order_date': order.order_date.strftime('%Y-%m-%d'),
            'status': order.status,
            'payment_amount': order.payment_amount,
            'Work_pay': order.Work_pay,
            'bill_id': order.bill_id,
            'billnumberinput2': order.billnumberinput2,
            'due_date': order.due_date.strftime('%Y-%m-%d'),
            'payment_mode': order.payment_mode,
            'payment_status': order.payment_status,
            'workers': [{
                'worker_id': worker.id,
                'name': worker.name
            } for worker in order.workers]  # List of workers assigned to the order
        } for order in orders]

        # Return the list of orders as JSON
        return jsonify(orders_data), 200

    except Exception as e:
        print(f"Error occurred: {e}")  # Print error for debugging
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
