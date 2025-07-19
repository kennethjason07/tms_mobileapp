from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        # Fetch all orders from the database
        orders = Order.query.all()

        # Create a dictionary to group orders by delivery date
        grouped_orders = {}

        for order in orders:
            # Format the delivery date as a string
            delivery_date = order.due_date.strftime('%Y-%m-%d')

            # If this delivery date is not in the dictionary, add it
            if delivery_date not in grouped_orders:
                grouped_orders[delivery_date] = []

            # Get the associated bill to get customer details
            bill = Bill.query.get(order.bill_id)

            # Collect worker details for each order
            worker_details = [
                {
                    'worker_id': worker.id,
                    'name': worker.name,
                    'Rate': worker.Rate,
                    'Suit': worker.Suit,
                    'Jacket': worker.Jacket,
                    'Sadri': worker.Sadri,
                    'Others': worker.Others
                }
                for worker in order.workers
            ]

            # Append the order details to the corresponding delivery date
            grouped_orders[delivery_date].append({
                'id': order.id,
                'garment_type': order.garment_type,
                'status': order.status,
                'order_date': order.order_date.strftime('%Y-%m-%d'),  # Format date as string
                'due_date': order.due_date.strftime('%Y-%m-%d'),  # Format date as string
                'total_amt': order.total_amt,
                'payment_mode': order.payment_mode,
                'payment_status': order.payment_status,
                'payment_amount': order.payment_amount,
                'bill_id': order.bill_id,
                'billnumberinput2': order.billnumberinput2,
                'workers': worker_details,  # Include list of assigned workers
                'Work_pay': order.Work_pay,
                'customer_mobile': bill.mobile_number if bill else None  # Add customer mobile number
            })

        # Return the grouped orders as JSON
        return jsonify(grouped_orders), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/search', methods=['GET'])
def search_orders():
    try:
        # Get the search query from the request args
        bill_number_query = request.args.get('bill_number', '').strip()

        if not bill_number_query:
            return jsonify({"error": "No bill number provided for search"}), 400

        # Fetch all orders with a matching billnumberinput2 from the database
        orders = Order.query.filter(Order.billnumberinput2.ilike(f'%{bill_number_query}%')).all()

        if not orders:
            return jsonify({"error": "No orders found for the given bill number"}), 404

        # Prepare the response data for each order
        orders_data = []
        for order in orders:
            # Prepare the worker details
            worker_details = [
                {
                    'worker_id': worker.id,
                    'name': worker.name,
                    'Rate': worker.Rate,
                    'Suit': worker.Suit,
                    'Jacket': worker.Jacket,
                    'Sadri': worker.Sadri,
                    'Others': worker.Others
                }
                for worker in order.workers
            ]

            # Prepare the order details
            order_data = {
                'id': order.id,
                'garment_type': order.garment_type,
                'status': order.status,
                'order_date': order.order_date.strftime('%Y-%m-%d'),
                'due_date': order.due_date.strftime('%Y-%m-%d'),
                'total_amt': order.total_amt,
                'payment_mode': order.payment_mode,
                'payment_status': order.payment_status,
                'payment_amount': order.payment_amount,
                'bill_id': order.bill_id,
                'billnumberinput2': order.billnumberinput2,
                'workers': worker_details,
                'Work_pay': order.Work_pay
            }

            orders_data.append(order_data)

        return jsonify(orders_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    


@app.route('/api/orders/<int:order_id>/update-advance-amount', methods=['POST'])
def update_advance_amount(order_id):
    try:
        data = request.get_json()
        new_amount = data.get('payment_amount')

        if new_amount is None or new_amount < 0:
            return jsonify({'error': 'Invalid advance amount'}), 400

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        order.payment_amount = new_amount
        db.session.commit()

        return jsonify({'message': 'Advance amount updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/bill/<int:bill_id>/update-status', methods=['PUT'])
def update_all_status(bill_id):
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({"error": "No status provided"}), 400

    try:
        orders = Order.query.filter_by(bill_id=bill_id).all()
        for order in orders:
            order.status = new_status
        db.session.commit()
        return jsonify({"success": True, "updated_count": len(orders)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
