from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order, Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func, desc

@app.route('/api/worker-weekly-pay', methods=['GET'])
def worker_weekly_pay():
    try:
        # Get all workers
        workers = Worker.query.all()
        result = {}

        for worker in workers:
            # Get all orders for this worker
            orders = db.session.query(Order)\
                .join(order_worker_association)\
                .filter(order_worker_association.c.worker_id == worker.id)\
                .all()

            # Get all expenses for this worker
            expenses = Worker_Expense.query.filter_by(worker_id=worker.id).all()

            # Group orders by week
            weekly_data = {}
            
            for order in orders:
                if not order.order_date:
                    continue
                    
                # Calculate the start of the week for this order
                order_date = order.order_date
                week_start = order_date - timedelta(days=order_date.weekday())
                week_key = week_start.strftime('%Y-%m-%d')
                
                if week_key not in weekly_data:
                    weekly_data[week_key] = {
                        'week_start': week_start.strftime('%Y-%m-%d'),
                        'week_end': (week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
                        'orders_count': 0,
                        'total_work_pay': 0,
                        'amount_paid': 0
                    }
                
                weekly_data[week_key]['orders_count'] += 1
                weekly_data[week_key]['total_work_pay'] += order.Work_pay or 0

            # Add expenses to weekly data
            for expense in expenses:
                if not expense.Date:
                    continue
                    
                expense_date = expense.Date
                week_start = expense_date - timedelta(days=expense_date.weekday())
                week_key = week_start.strftime('%Y-%m-%d')
                
                if week_key in weekly_data:
                    weekly_data[week_key]['amount_paid'] += expense.Amt_Paid or 0
                else:
                    weekly_data[week_key] = {
                        'week_start': week_start.strftime('%Y-%m-%d'),
                        'week_end': (week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
                        'orders_count': 0,
                        'total_work_pay': 0,
                        'amount_paid': expense.Amt_Paid or 0
                    }

            # Convert to list and sort by week
            weeks_list = [
                {
                    'week_start': data['week_start'],
                    'week_end': data['week_end'],
                    'orders_count': data['orders_count'],
                    'total_work_pay': data['total_work_pay'],
                    'amount_paid': data['amount_paid'],
                    'remaining_pay': data['total_work_pay'] - data['amount_paid']
                }
                for data in weekly_data.values()
            ]
            
            # Sort weeks by start date (newest first)
            weeks_list.sort(key=lambda x: x['week_start'], reverse=True)

            result[worker.id] = {
                'worker_id': worker.id,
                'worker_name': worker.name,
                'weekly_data': weeks_list
            }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/weekly-pay/<int:worker_id>', methods=['GET'])
def get_worker_weekly_pay(worker_id):
    try:
        worker = Worker.query.get(worker_id)
        if not worker:
            return jsonify({'error': 'Worker not found'}), 404
        
        all_orders = db.session.query(Order)\
            .join(order_worker_association)\
            .filter(order_worker_association.c.worker_id == worker_id)\
            .order_by(Order.order_date.desc())\
            .all()
            
        all_expenses = Worker_Expense.query.filter_by(worker_id=worker_id)\
            .order_by(Worker_Expense.date.desc())\
            .all()
        
        weekly_data = {}
        
        # Adjust to Sunday-Saturday week
        for order in all_orders:
            if not order.order_date:
                continue
                
            # Calculate week start (Sunday) and end (Saturday)
            current_weekday = order.order_date.weekday()
            days_since_sunday = (current_weekday + 1) % 7  # Adjust to make Sunday the first day
            week_start = order.order_date - timedelta(days=days_since_sunday)
            week_end = week_start + timedelta(days=6)
            week_key = week_start.strftime('%Y-%m-%d')
            
            if week_key not in weekly_data:
                weekly_data[week_key] = {
                    'start_date': week_start.strftime('%Y-%m-%d'),
                    'end_date': week_end.strftime('%Y-%m-%d'),
                    'orders': [],
                    'total_work_pay': 0,
                    'total_paid': 0,
                    'order_count': 0
                }
            
            weekly_data[week_key]['orders'].append({
                'order_number': order.billnumberinput2 or order.id,
                'work_pay': order.Work_pay or 0
            })
            weekly_data[week_key]['total_work_pay'] += order.Work_pay or 0
            weekly_data[week_key]['order_count'] += 1

        # Process expenses with Sunday-Saturday week
        for expense in all_expenses:
            if not expense.date:
                continue
                
            current_weekday = expense.date.weekday()
            days_since_sunday = (current_weekday + 1) % 7
            week_start = expense.date - timedelta(days=days_since_sunday)
            week_key = week_start.strftime('%Y-%m-%d')
            
            if week_key in weekly_data:
                weekly_data[week_key]['total_paid'] += expense.Amt_Paid or 0
            else:
                week_end = week_start + timedelta(days=6)
                weekly_data[week_key] = {
                    'start_date': week_start.strftime('%Y-%m-%d'),
                    'end_date': week_end.strftime('%Y-%m-%d'),
                    'orders': [],
                    'total_work_pay': 0,
                    'total_paid': expense.Amt_Paid or 0,
                    'order_count': 0
                }

        # Calculate totals and format response
        total_orders = 0
        total_work_pay = 0
        total_paid = 0
        weeks_list = []

        for week_key, data in weekly_data.items():
            total_orders += data['order_count']
            total_work_pay += data['total_work_pay']
            total_paid += data['total_paid']
            
            weeks_list.append({
                'week_period': f"{data['start_date']} to {data['end_date']}",
                'order_count': data['order_count'],
                'total_work_pay': round(data['total_work_pay'], 2),
                'total_paid': round(data['total_paid'], 2),
                'remaining': round(data['total_work_pay'] - data['total_paid'], 2),
                'orders': data['orders']
            })

        weeks_list.sort(key=lambda x: x['week_period'], reverse=True)

        return jsonify({
            'worker_name': worker.name,
            'total_summary': {
                'total_orders': total_orders,
                'total_work_pay': round(total_work_pay, 2),
                'total_paid': round(total_paid, 2),
                'total_remaining': round(total_work_pay - total_paid, 2)
            },
            'weekly_data': weeks_list
        }), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
  
if __name__ == "__main__":
    app.run(debug=True)
