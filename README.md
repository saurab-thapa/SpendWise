# SpendWise
Personal Finance Tracker
SpendWise is a full-stack web application designed to help users manage their personal finances. It allows users to track income and expenses, set monthly budgets, monitor savings goals, and analyze their spending habits through charts and reports.

The application supports three account types: Student, Working Professional, and Personal Finance, providing different dashboard presentations and financial guidance based on the selected account type.
🚀 Features
- User Authentication: Secure registration and login with password hashing.
- Dashboard: View monthly income, expenses, net cash flow, and recent transactions.
- Transaction Management: Add, view, edit, delete, and filter income and expense records.
- Budget Management: Create monthly overall budgets and category-specific budgets.
- Savings Goals: Create savings goals, record contributions, and monitor progress.
- Financial Analytics: View spending by category and analyze income and expense trends.
- Reports: Generate monthly summaries, export transactions as CSV, and print reports.
- Custom Categories: Create and manage custom income and expense categories.
- Account Types: Choose between Student, Working Professional, and Personal Finance.
- Responsive Design: Use the application across different screen sizes.
- Account Settings: Manage profile details, change passwords, and update account preferences.
Note: SpendWise is a manual finance-tracking application. It does not connect to bank accounts or perform actual money transfers. Savings contributions are tracking records, not real deposits.
🛠️ Technology Stack
Frontend
- React
- JavaScript (ES modules)
- JSX
- React Router
- Vite
- Recharts
- Lucide React
- CSS
Backend
- Node.js
- Express.js
Database
- MongoDB
- Mongoose
Authentication and Security
- bcryptjs for password hashing
- express-session for session-based authentication
- connect-mongo for storing sessions in MongoDB
- Helmet for security-related HTTP headers
- CORS for cross-origin request handling
- Express Rate Limit for limiting requests
- Zod for request validation
Testing and Code Quality
- Vitest
- Supertest
- ESLint
🏗️ Application Architecture
SpendWise follows a full-stack architecture consisting of three main layers.
1. Frontend
The frontend is built with React. It provides the user interface, including the dashboard, transaction forms, budget management pages, savings goals, and analytics charts.
2. Backend
The backend uses Node.js and Express.js to process API requests, validate input, handle authentication, and manage application logic.
3. Database
MongoDB stores user information, transactions, budgets, savings goals, and other application data. Mongoose provides models and methods for interacting with the database.
How It Works
1. The user interacts with the React frontend.
2. React sends an API request to the Express backend.
3. The backend processes the request and validates the data.
4. Mongoose reads from or writes to MongoDB.
5. The backend sends a response to the frontend.
6. React updates the interface with the returned data.
📋 Prerequisites
Before running SpendWise, make sure you have installed:
- Node.js and npm
- MongoDB, either locally or through a MongoDB hosting service
⚙️ Installation and Setup
Step 1: Clone the Repository
git clone <your-repository-url>
cd SpendWise

Replace <your-repository-url> with your actual repository URL.
Step 2: Install Dependencies
Run the following command from the project root:
npm install

This installs the dependencies required by the project and its npm workspaces.
Step 3: Configure Environment Variables
Create a .env file in the project root using .env.example as a reference.

Add the environment variables required by your application, including:
- MongoDB connection URI
- Session secret
Use the exact variable names specified in .env.example.

Important: Never commit your .env file or share your session secret.
Step 4: Start the Application
Run:
npm run dev

This starts the frontend development server and backend server together.

By default:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
The Vite development server forwards /api requests to the backend.
Step 5: Build for Production
To create a production build of the frontend, run:
npm run build

The generated frontend files are placed in client/dist. In production, the Express application serves the built frontend.
🔐 Authentication and Security
SpendWise uses session-based authentication.
- Passwords are hashed using bcryptjs before being stored.
- express-session manages user sessions.
- connect-mongo stores session data in MongoDB.
- Protected routes require an authenticated session.
- Zod validates API request data.
- Helmet helps secure HTTP headers.
- Express Rate Limit helps restrict excessive requests.
- Backend operations scope financial records to the logged-in user.
📊 Financial Calculations
SpendWise calculates financial summaries using the user's transaction records.
- Total Income: Sum of income transactions for the selected period.
- Total Expenses: Sum of expense transactions for the selected period.
- Net Cash Flow: Total income minus total expenses.
- Remaining Budget: Overall monthly budget minus expenses, when an overall budget is configured.
- Category Spending: Groups expenses by category.
- Savings Progress: Tracks recorded contributions toward savings goals.
Money is stored internally as integer minor units, such as paise or cents, to reduce floating-point rounding errors. Transaction dates and monthly calculations use UTC boundaries to reduce timezone-related date shifts.
🧪 Testing
SpendWise uses:
- Vitest for running tests.
- Supertest for testing backend API requests.
- ESLint for checking code quality and consistency.
The backend tests cover areas such as API registration, account switching, budget templates, analytics calculations, record ownership, request validation, CSV escaping, and UTC month boundaries.

Run the project's configured test command:
npm test

📁 Project Structure
SpendWise/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   ├── index.html
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── tests/
├── .env.example
├── package.json
└── package-lock.json

🎯 Project Objectives
- Simplify personal income and expense tracking.
- Help users plan and monitor monthly budgets.
- Encourage better savings habits through goal tracking.
- Provide clear visual summaries of financial activity.
- Demonstrate full-stack web development using React, Node.js, Express, and MongoDB.
- Implement session-based authentication and user-specific data access.
🔮 Future Enhancements
Possible future improvements include:
- Automated transaction imports.
- Bank integration, where supported and securely implemented.
- Advanced financial insights.
- More detailed budgeting and savings recommendations.
- Additional data visualization and reporting options.