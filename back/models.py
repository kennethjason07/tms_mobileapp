from datetime import date, datetime
from back.app import db

# Association table remains unchanged
order_worker_association = db.Table(
    'order_worker_association',
    db.Column('order_id', db.Integer, db.ForeignKey('orders.id'), primary_key=True),
    db.Column('worker_id', db.Integer, db.ForeignKey('workers.id'), primary_key=True)
)

class Measurement(db.Model):
    __tablename__ = 'measurements'
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(15), nullable=False, unique=True, index=True)

    # Pant measurements
    pant_length = db.Column(db.Float)
    pant_kamar = db.Column(db.Float)
    pant_hips = db.Column(db.Float)
    pant_waist = db.Column(db.Float)
    pant_ghutna = db.Column(db.Float)
    pant_bottom = db.Column(db.Float)
    pant_seat = db.Column(db.Float)
    SideP_Cross = db.Column(db.Text)
    Plates = db.Column(db.Text)
    Belt = db.Column(db.Text)
    Back_P = db.Column(db.Text)
    WP = db.Column(db.Text)

    # Shirt measurements
    shirt_length = db.Column(db.Float)
    shirt_body = db.Column(db.Text)
    shirt_loose = db.Column(db.Text)
    shirt_shoulder = db.Column(db.Float)
    shirt_astin = db.Column(db.Float)
    shirt_collar = db.Column(db.Float)
    shirt_aloose = db.Column(db.Float)
    Callar = db.Column(db.Text)
    Cuff = db.Column(db.Text)
    Pkt = db.Column(db.Text)
    LooseShirt = db.Column(db.Text)
    DT_TT = db.Column(db.Text)

    # Additional fields
    extra_measurements = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def as_dict(self):
        return {
            'phone_number': self.phone_number,
            'pant_length': self.pant_length,
            'pant_kamar': self.pant_kamar,
            'pant_hips': self.pant_hips,
            'pant_waist': self.pant_waist,
            'pant_ghutna': self.pant_ghutna,
            'pant_bottom': self.pant_bottom,
            'pant_seat': self.pant_seat,
            'SideP_Cross': self.SideP_Cross,
            'Plates': self.Plates,
            'Belt': self.Belt,
            'Back_P': self.Back_P,
            'WP': self.WP,
            'shirt_length': self.shirt_length,
            'shirt_body': self.shirt_body,
            'shirt_loose': self.shirt_loose,
            'shirt_shoulder': self.shirt_shoulder,
            'shirt_astin': self.shirt_astin,
            'shirt_collar': self.shirt_collar,
            'shirt_aloose': self.shirt_aloose,
            'Callar': self.Callar,
            'Cuff': self.Cuff,
            'Pkt': self.Pkt,
            'LooseShirt': self.LooseShirt,
            'DT_TT': self.DT_TT,
            'extra_measurements': self.extra_measurements
        }

class Bill(db.Model):
    __tablename__ = 'bills'
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    mobile_number = db.Column(db.String(15), nullable=False)
    date_issue = db.Column(db.Date, nullable=False)
    delivery_date = db.Column(db.Date, nullable=False)
    suit_qty = db.Column(db.Integer, default=0)
    safari_qty = db.Column(db.Integer, default=0)
    pant_qty = db.Column(db.Integer, default=0)
    shirt_qty = db.Column(db.Integer, default=0)
    sadri_qty = db.Column(db.Integer, default=0)
    total_qty = db.Column(db.Integer, default=0)
    today_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    total_amt = db.Column(db.Float, nullable=False)
    payment_mode = db.Column(db.String(50), nullable=False)
    payment_status = db.Column(db.String(50), nullable=False)
    payment_amount = db.Column(db.Float, default=0)

    # Relationship with orders
    orders = db.relationship('Order', backref='bill', lazy=True)

    def as_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'mobile_number': self.mobile_number,
            'date_issue': self.date_issue.isoformat() if self.date_issue else None,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'suit_qty': self.suit_qty,
            'safari_qty': self.safari_qty,
            'pant_qty': self.pant_qty,
            'shirt_qty': self.shirt_qty,
            'sadri_qty': self.sadri_qty,
            'total_qty': self.total_qty,
            'today_date': self.today_date.isoformat() if self.today_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'total_amt': self.total_amt,
            'payment_mode': self.payment_mode,
            'payment_status': self.payment_status,
            'payment_amount': self.payment_amount
        }
class Worker(db.Model):
    __tablename__ = 'workers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    number = db.Column(db.String(15), nullable=False)
    Rate = db.Column(db.Float, nullable=True)
    Suit = db.Column(db.Float, nullable=True)
    Jacket = db.Column(db.Float, nullable=True)
    Sadri = db.Column(db.Float, nullable=True)
    Others = db.Column(db.Float, nullable=True)
    
    # Relationship to Worker_Expense (one-to-many)
    worker_expense = db.relationship('Worker_Expense', backref='worker', lazy=True)


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    garment_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    order_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    total_amt = db.Column(db.Float, nullable=False)
    payment_mode = db.Column(db.String(50), nullable=False)
    payment_status = db.Column(db.String(50), nullable=False)
    payment_amount = db.Column(db.Float, nullable=False)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    Work_pay = db.Column(db.Float, nullable=True)
    billnumberinput2 = db.Column(db.Float, nullable=True)

    # ForeignKey to Bill table
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)

    # Many-to-many relationship with Worker
    workers = db.relationship(
        'Worker',
        secondary=order_worker_association,
        backref=db.backref('orders', lazy='dynamic')
    )

    def as_dict(self):
        return {
            'id': self.id,
            'garment_type': self.garment_type,
            'status': self.status,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'total_amt': self.total_amt,
            'payment_mode': self.payment_mode,
            'payment_status': self.payment_status,
            'payment_amount': self.payment_amount,
            'Work_pay': self.Work_pay,
            'billnumberinput2': self.billnumberinput2,
            'worker_ids': [worker.id for worker in self.workers]  # Include worker IDs in dictionary
        }
    
class Worker_Expense(db.Model):
    __tablename__ = 'Worker_Expense'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    Amt_Paid = db.Column(db.Float, nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=True)

class Daily_Expenses(db.Model):
    __tablename__ = 'Daily_Expenses'

    id = db.Column(db.Integer, primary_key=True)
    Date = db.Column(db.Date, nullable=False)
    material_cost = db.Column(db.Float)
    material_type = db.Column(db.String(100))
    miscellaneous_Cost = db.Column(db.Float)  # Ensure this matches exactly
    miscellaenous_item = db.Column(db.String(100))  # Ensure this matches exactly
    chai_pani_cost = db.Column(db.Float)
    # worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'))
    Total_Pay = db.Column(db.Float, nullable=True)
