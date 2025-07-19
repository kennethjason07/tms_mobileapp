from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/workers', methods=['GET'])
def get_workers():
    try:
        # Fetch all workers from the database
        workers = Worker.query.all()

        # Create a list to hold the workers' data
        worker_list = []

        for worker in workers:
            # Append worker details to the list
            worker_list.append({
                'id': worker.id,
                'name': worker.name,
                'number': worker.number,
                'Rate' : worker.Rate,
                'Suit' : worker.Suit,
                'Jacket' : worker.Jacket,
                'Sadri' : worker.Sadri,
                'Others' :worker.Others
            })

        # Return the list of workers as JSON
        return jsonify(worker_list), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
