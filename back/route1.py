from flask import Flask, request, jsonify
from flask_cors import CORS
from back.app import app, db
from back.models import Bill, Order,Worker, Daily_Expenses, Worker_Expense, order_worker_association, Measurement
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

@app.route('/api/new-bill', methods=['POST'])
def new_bill():
    try:
        data = request.get_json()

        # Helper function to parse dates
        def parse_date(date_str):
            return datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None

        # Extract data from request
        customer_name = data.get('customerName')
        mobile_number = data.get('mobileNo')
        date_issue = parse_date(data.get('dateIssue'))
        delivery_date = parse_date(data.get('deliveryDate'))
        today_date = parse_date(data.get('todayDate'))
        due_date = parse_date(data.get('dueDate'))

        suit_qty = data.get('suitQty', 0)
        safari_qty = data.get('safariQty', 0)
        pant_qty = data.get('pantQty', 0)
        shirt_qty = data.get('shirtQty', 0)
        sadri_qty = data.get('sadriQty', 0)
        total_qty = data.get('totalQty', 0)
        total_amt = data.get('totalAmt', 0.0)
        payment_mode = data.get('paymentMode')
        payment_status = data.get('paymentStatus')
        payment_amount = data.get('payment_amount')

        # Pant measurements
        pant_measurements = {
            "pant_length": data.get('pantLength'),
            "pant_kamar": data.get('pantKamar'),
            "pant_hips": data.get('pantHips'),
            "pant_waist": data.get('pantWaist'),
            "pant_ghutna": data.get('pantGhutna'),
            "pant_bottom": data.get('pantBottom'),
            "pant_seat": data.get('pantSeat'),
            "SideP_Cross": data.get('SideP_Cross'),
            "Plates": data.get('Plates'),
            "Belt": data.get('Belt'),
            "Back_P": data.get('Back_P'),
            "WP": data.get('WP'),
        }

        # Shirt measurements
        shirt_measurements = {
            "shirt_length": data.get('shirtLength'),
            "shirt_body": data.get('shirtBody'),
            "shirt_loose": data.get('shirtLoose'),
            "shirt_shoulder": data.get('shirtShoulder'),
            "shirt_astin": data.get('shirtAstin'),
            "shirt_collar": data.get('shirtCollar'),
            "shirt_aloose": data.get('shirtAloose'),
            "Callar": data.get('Callar'),
            "Cuff": data.get('Cuff'),
            "Pkt": data.get('Pkt'),
            "LooseShirt": data.get('LooseShirt'),
            "DT_TT": data.get('DT_TT'),
        }

        extra_measurements = data.get('extraMeasurements')
        billnumberinput2 = data.get('billnumberinput2')

        # Fetch or create measurements for this phone number
        measurement = Measurement.query.filter_by(phone_number=mobile_number).first()
        if not measurement:
            measurement = Measurement(phone_number=mobile_number)
            db.session.add(measurement)

        # Update measurements if new values are provided
        for key, value in {**pant_measurements, **shirt_measurements, "extra_measurements": extra_measurements}.items():
            if value is not None:
                setattr(measurement, key, value)

        db.session.commit()

        # Helper function to create or update orders
        def update_or_create_orders(bill_id, garment, quantity):
            existing_orders = Order.query.filter_by(bill_id=bill_id, garment_type=garment).all()
            current_order_count = len(existing_orders)

            # Update existing orders
            for i in range(min(current_order_count, quantity)):
                existing_orders[i].order_date = datetime.now().date()
                existing_orders[i].due_date = due_date
                existing_orders[i].total_amt = total_amt
                existing_orders[i].payment_mode = payment_mode
                existing_orders[i].payment_status = payment_status
                existing_orders[i].payment_amount = payment_amount
                existing_orders[i].status = 'Pending'

            # Add new orders if quantity exceeds existing orders
            for _ in range(quantity - current_order_count):
                new_order = Order(
                    garment_type=garment,
                    status='Pending',
                    order_date=datetime.now().date(),
                    due_date=due_date,
                    total_amt=total_amt,
                    payment_mode=payment_mode,
                    payment_status=payment_status,
                    payment_amount=payment_amount,
                    bill_id=bill_id,
                    billnumberinput2=billnumberinput2
                )
                db.session.add(new_order)

            # Remove extra orders if quantity is reduced
            for i in range(quantity, current_order_count):
                db.session.delete(existing_orders[i])

        # Create a new bill
        new_bill = Bill(
            customer_name=customer_name,
            mobile_number=mobile_number,
            date_issue=date_issue,
            delivery_date=delivery_date,
            suit_qty=suit_qty,
            safari_qty=safari_qty,
            pant_qty=pant_qty,
            shirt_qty=shirt_qty,
            sadri_qty=sadri_qty,
            total_qty=total_qty,
            today_date=today_date,
            due_date=due_date,
            total_amt=total_amt,
            payment_mode=payment_mode,
            payment_status=payment_status,
            payment_amount=payment_amount
        )

        db.session.add(new_bill)
        db.session.commit()

        # Create orders for the new bill
        if suit_qty > 0:
            update_or_create_orders(new_bill.id, 'Suit', suit_qty)
        if safari_qty > 0:
            update_or_create_orders(new_bill.id, 'Safari', safari_qty)
        if pant_qty > 0:
            update_or_create_orders(new_bill.id, 'Pant', pant_qty)
        if shirt_qty > 0:
            update_or_create_orders(new_bill.id, 'Shirt', shirt_qty)
        if sadri_qty > 0:
            update_or_create_orders(new_bill.id, 'Sadri', sadri_qty)

        db.session.commit()
        return jsonify({'message': 'Bill and orders created successfully', 'bill_id': new_bill.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
          
if __name__ == "__main__":
    app.run(debug=True)
