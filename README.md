# Yak's Men's Wear - Tailoring Management System (TMS)

Welcome to the **Tailoring Management System (TMS)**! This is a comprehensive, mobile-first solution designed specifically for tailor shops to manage their entire workflow—from taking measurements and tracking orders to managing worker payouts and calculating daily profits.

---

## 🚀 What is this project?

In a traditional tailor shop, keeping track of paper receipts, customer measurements, and worker commissions can be a nightmare. This app replaces the "khata" (register) with a modern digital system.

**The core goal:** Ensure that no order is lost, every rupee is accounted for, and workers are paid correctly for the work they do.

---

## ✨ Key Features

### 1. 👕 Smart Order Management

- **Detailed Billing:** Create professional bills with multi-item support (Shirt, Pant, Safari, Suit, etc.).
- **Measurement Archiving:** Store customer measurements digitally. No more searching through old notebooks.
- **Order Tracking:** Monitor the status of orders (Pending, Processing, Completed, Paid).

### 2. 💰 Advanced Financial Tracking (Two-Stage Revenue)

This is a standout feature of our system:

- **Advance Recognition:** Revenue is recorded as soon as a customer pays an advance.
- **Balance Recognition:** Remaining revenue is automatically tracked when the order is marked as "Paid" upon delivery.
- **Daily/Monthly/Weekly Reports:** Get instant insights into your shop's performance with beautiful dashboards.

### 3. 🧵 Worker Management

- **Task Assignment:** Assign specific garments within an order to different workers.
- **Automatic Pay Calculation:** The system calculates worker commissions based on the date they were _assigned_ the work, ensuring fair weekly payouts.
- **Expense Tracking:** Track shop and worker-specific expenses to see net profit.

### 4. 📱 WhatsApp Integration

- Send automated order confirmations and "Order Ready" notifications directly to the customer's WhatsApp, improving customer service and reducing manual calls.

---

## 🛠 Tech Stack

We use modern, reliable technologies to ensure the app is fast and stable:

- **Frontend:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (Cross-platform: Android, iOS, and Web).
- **Backend/Database:** [Supabase](https://supabase.com/) (An open-source Firebase alternative providing real-time database and authentication).
- **Secondary Backend:** Python [Flask](https://flask.palletsprojects.com/) (For specialized processing tasks).
- **Styling:** React Native Paper & Linear Gradients for a premium look and feel.
- **Hosting:** [Netlify](https://www.netlify.com/) (for the web version) and [EAS](https://expo.dev/eas) (for Android/iOS builds).

---

## 🏁 Getting Started (Beginner's Guide)

Follow these steps to get the app running on your own machine.

### 1. Prerequisites

- **Node.js** (v18 or higher)
- **Expo Go** app installed on your smartphone (to test the mobile version)
- A **Supabase** account (Free tier)

### 2. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/your-repo/tms.git
cd tms

# Install JavaScript dependencies
npm install
```

### 3. Database Setup (The "Brain" of the App)

1. Create a new project on [Supabase](https://app.supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Locate the `setup_revenue_tracking.sql` and `migrations/` files in this project.
4. Copy-paste and run these scripts in Supabase to create the necessary tables (`orders`, `workers`, `revenue_tracking`, etc.).

### 4. Connect the App

Create a `.env` file in the root directory and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Running the App

```bash
# Start the Expo development server
npx expo start
```

- **Mobile:** Scan the QR code displayed in your terminal using the **Expo Go** app.
- **Web:** Press `w` in your terminal to open the web version in your browser.

---

## 📂 Project Structure

- `App.js`: The entry point of the application.
- `/screens`: Contains all the main pages (Dashboard, New Bill, Profit Screens).
- `/components`: Reusable UI elements like buttons and cards.
- `/back`: The Python Flask backend logic.
- `/migrations`: SQL scripts to set up your database.
- `supabase.js`: Configuration for connecting to the database.

---

## 🤝 Troubleshooting for Beginners

- **Issue:** The app opens but shows no data.
  - **Check:** Ensure your Supabase URL and Key are correct in `.env` and that you've run the SQL scripts in the Supabase dashboard.
- **Issue:** `npm install` fails.
  - **Check:** Try deleting `node_modules` and running `npm install` again. Ensure you are using a compatible Node.js version.
- **Issue:** WhatsApp doesn't open.
  - **Check:** WhatsApp integration works best on real mobile devices where the app is installed.

---

## 📜 License

This project is private and intended for internal use at Yak's Men's Wear.

---

_Developed with ❤️ for the tailoring community._
