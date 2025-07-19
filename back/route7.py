from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/workers', methods=['POST'])
def add_worker():
    try:
        # Get the list of worker details from the request body
        data = request.get_json()

        if not isinstance(data, list):
            return jsonify({'error': 'Invalid input, expected a list of workers'}), 400

        workers_added = []

        # Iterate over the list of workers
        for worker_data in data:
            name = worker_data.get('name')
            number = worker_data.get('number')  # Corrected field from 'mobile' to 'number'
            Rate = worker_data.get('Rate')
            Suit = worker_data.get('Suit')
            Jacket = worker_data.get('Jacket')
            Sadri = worker_data.get('Sadri')
            Others = worker_data.get('Others')

            if not name or not number:
                return jsonify({'error': 'Name and number are required fields for all workers'}), 400

            # Create a new Worker object for each worker
            new_worker = Worker(
                name=name, 
                number=number, 
                Rate=Rate, 
                Suit=Suit, 
                Jacket=Jacket, 
                Sadri=Sadri, 
                Others=Others
            )

            # Add the new worker to the database
            db.session.add(new_worker)
            db.session.commit()

            # Add worker to the result list
            workers_added.append({
                'id': new_worker.id,
                'name': new_worker.name,
                'number': new_worker.number,
                'Rate' : new_worker.Rate,
                'Suit' : new_worker.Suit,
                'Jacket' : new_worker.Jacket,
                'Sadri' : new_worker.Sadri,
                'Others' : new_worker.Others
            })

        # Return a success message with the details of all added workers
        return jsonify({'message': 'Workers added successfully', 'workers': workers_added}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
