from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

            
# Updated route for assigning multiple workers to an order
@app.route('/api/orders/<int:order_id>/assign-workers', methods=['PUT'])
def assign_workers(order_id):
    try:
        data = request.get_json()
        worker_ids = data.get('worker_ids', [])

        # Fetch the order by ID
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        # Fetch all workers based on worker IDs provided
        workers = Worker.query.filter(Worker.id.in_(worker_ids)).all()
        if not workers:
            return jsonify({'error': 'One or more workers not found'}), 404

        # Assign workers to the order and calculate Work_pay
        order.workers = workers  # Update the relationship
        total_work_pay = sum(
            worker.Suit if order.garment_type == 'Suit' else
            worker.Jacket if order.garment_type == 'Jacket' else
            worker.Sadri if order.garment_type == 'Sadri' else
            worker.Rate  # Default rate for other types
            for worker in workers
        )
        order.Work_pay = total_work_pay

        db.session.commit()

        return jsonify({'success': True, 'work_pay': total_work_pay}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
