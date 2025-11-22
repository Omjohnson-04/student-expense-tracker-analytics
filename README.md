Student Expense Tracker

A simple mobile application built with React Native, Expo, and SQLite that allows students to track their daily expenses, categorize spending, filter by time period, and edit/delete previous entries.

This project fulfills the assignment requirements for Task 1–3, including:

Adding expenses

Categorizing expenses

Viewing spending totals

Filtering by Week/Month/All

Editing & deleting expenses

Storing data locally using SQLite

✨ Features
✅ Task 1 – Expense Input & List

Add expenses with:

Amount

Category

Optional note

Auto-generated date (YYYY-MM-DD)

Display all saved expenses in a list

Each item shows:

Amount

Category

Note

Delete button

✅ Task 2 – Filtering & Summaries

Filter expenses by:

ALL

THIS WEEK

THIS MONTH

Display:

Total spending for selected filter

Total by category for selected filter

✅ Task 3 – Editing Expenses

Tap an expense to open the Edit Modal

Edit:

Amount

Category

Note

Date

Save changes or cancel

Changes persist in SQLite

🚀 Getting Started (Run Locally)
1. Clone the repository
git clone <your-repo-url>
cd <project-folder>

2. Install dependencies
npm install

3. Start the Expo development server
npm start


Or:

npx expo start

4. Run on a device or emulator

Press i for iOS Simulator

Press a for Android Emulator

Or scan the QR code in Expo Go

🗄 Database Info (SQLite)
Table Structure:
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL
);

All data is saved locally and persists even when the app restarts.