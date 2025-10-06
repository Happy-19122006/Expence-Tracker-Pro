// dummyData.js - Sample data for ExpenseTracker Pro

export const dummyTransactions = [
  {
    type: "income",
    amount: 25000,
    category: "Salary",
    date: "2025-10-01",
    note: "October salary"
  },
  {
    type: "expense",
    amount: 3200,
    category: "Rent",
    date: "2025-10-02",
    note: "Monthly room rent"
  },
  {
    type: "expense",
    amount: 1500,
    category: "Groceries",
    date: "2025-10-03",
    note: "Weekly grocery shopping"
  },
  {
    type: "expense",
    amount: 800,
    category: "Transport",
    date: "2025-10-04",
    note: "Metro card recharge"
  },
  {
    type: "income",
    amount: 5000,
    category: "Freelance",
    date: "2025-10-05",
    note: "Logo design for client"
  },
  {
    type: "expense",
    amount: 1200,
    category: "Food & Dining",
    date: "2025-10-06",
    note: "Restaurant dinner with friends"
  },
  {
    type: "expense",
    amount: 450,
    category: "Bills & Utilities",
    date: "2025-10-07",
    note: "Electricity bill"
  },
  {
    type: "expense",
    amount: 300,
    category: "Health & Fitness",
    date: "2025-10-08",
    note: "Gym membership"
  },
  {
    type: "income",
    amount: 800,
    category: "Freelance",
    date: "2025-10-09",
    note: "Website maintenance"
  },
  {
    type: "expense",
    amount: 600,
    category: "Shopping",
    date: "2025-10-10",
    note: "New clothes"
  },
  {
    type: "expense",
    amount: 200,
    category: "Entertainment",
    date: "2025-10-11",
    note: "Movie tickets"
  },
  {
    type: "expense",
    amount: 350,
    category: "Transportation",
    date: "2025-10-12",
    note: "Fuel for car"
  },
  {
    type: "income",
    amount: 1200,
    category: "Freelance",
    date: "2025-10-13",
    note: "Social media management"
  },
  {
    type: "expense",
    amount: 1800,
    category: "Food & Dining",
    date: "2025-10-14",
    note: "Grocery shopping"
  },
  {
    type: "expense",
    amount: 150,
    category: "Education",
    date: "2025-10-15",
    note: "Online course subscription"
  },
  {
    type: "expense",
    amount: 400,
    category: "Bills & Utilities",
    date: "2025-10-16",
    note: "Internet bill"
  },
  {
    type: "income",
    amount: 3000,
    category: "Freelance",
    date: "2025-10-17",
    note: "Mobile app development"
  },
  {
    type: "expense",
    amount: 700,
    category: "Health & Fitness",
    date: "2025-10-18",
    note: "Medical checkup"
  },
  {
    type: "expense",
    amount: 250,
    category: "Entertainment",
    date: "2025-10-19",
    note: "Concert tickets"
  },
  {
    type: "expense",
    amount: 900,
    category: "Shopping",
    date: "2025-10-20",
    note: "Electronics purchase"
  }
];

export const dummyCategories = [
  { id: 'salary', name: 'Salary', icon: 'fas fa-money-bill-wave', color: '#22c55e' },
  { id: 'freelance', name: 'Freelance', icon: 'fas fa-laptop-code', color: '#eab308' },
  { id: 'investments', name: 'Investments', icon: 'fas fa-chart-line', color: '#06b6d4' },
  { id: 'gifts', name: 'Gifts', icon: 'fas fa-gift', color: '#f472b6' },
  { id: 'business', name: 'Business', icon: 'fas fa-briefcase', color: '#8b5cf6' },
  { id: 'rent', name: 'Rent', icon: 'fas fa-home', color: '#ef4444' },
  { id: 'groceries', name: 'Groceries', icon: 'fas fa-shopping-cart', color: '#f59e0b' }
];

// Function to generate dummy data with different currencies
export function generateDummyTransactions(currency = 'USD') {
  const exchangeRates = {
    'USD': 1,
    'INR': 83,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110,
    'CAD': 1.25,
    'AUD': 1.35
  };

  const rate = exchangeRates[currency] || 1;
  
  return dummyTransactions.map(transaction => ({
    ...transaction,
    amount: Math.round(transaction.amount * rate)
  }));
}

// Function to get random transaction
export function getRandomTransaction() {
  const randomIndex = Math.floor(Math.random() * dummyTransactions.length);
  return dummyTransactions[randomIndex];
}

// Function to get transactions by type
export function getTransactionsByType(type) {
  return dummyTransactions.filter(tx => tx.type === type);
}

// Function to get transactions by category
export function getTransactionsByCategory(category) {
  return dummyTransactions.filter(tx => tx.category === category);
}

// Function to get monthly summary
export function getMonthlySummary() {
  const income = dummyTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const expense = dummyTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  return {
    totalIncome: income,
    totalExpense: expense,
    netBalance: income - expense,
    transactionCount: dummyTransactions.length
  };
}

// Function to get category breakdown
export function getCategoryBreakdown() {
  const breakdown = {};
  
  dummyTransactions.forEach(tx => {
    if (tx.type === 'expense') {
      breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.amount;
    }
  });
  
  return breakdown;
}
