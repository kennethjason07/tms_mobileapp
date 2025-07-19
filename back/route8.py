from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/workers/<int:id>', methods=['DELETE'])
def delete_worker(id):
    try:
        # Find the worker by ID
        worker = Worker.query.get(id)

        if not worker:
            return jsonify({'error': 'Worker not found'}), 404

        # Delete the worker from the database
        db.session.delete(worker)
        db.session.commit()

        return jsonify({'message': f'Worker {worker.name} removed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
