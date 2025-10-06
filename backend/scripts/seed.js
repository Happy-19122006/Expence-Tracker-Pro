const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');

// Sample data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    preferences: {
      currency: 'USD',
      theme: 'light',
      notifications: true
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    preferences: {
      currency: 'USD',
      theme: 'dark',
      notifications: true
    }
  }
];

const sampleTransactions = [
  {
    amount: 3000,
    type: 'income',
    description: 'Monthly Salary',
    note: 'Direct deposit from employer',
    date: new Date('2024-01-01')
  },
  {
    amount: 1200,
    type: 'expense',
    description: 'Rent Payment',
    note: 'Monthly apartment rent',
    date: new Date('2024-01-02')
  },
  {
    amount: 350,
    type: 'expense',
    description: 'Groceries',
    note: 'Weekly grocery shopping',
    date: new Date('2024-01-03')
  },
  {
    amount: 150,
    type: 'expense',
    description: 'Gas Bill',
    note: 'Monthly gas bill',
    date: new Date('2024-01-04')
  },
  {
    amount: 80,
    type: 'expense',
    description: 'Restaurant',
    note: 'Dinner with friends',
    date: new Date('2024-01-05')
  },
  {
    amount: 500,
    type: 'income',
    description: 'Freelance Work',
    note: 'Website design project',
    date: new Date('2024-01-10')
  },
  {
    amount: 200,
    type: 'expense',
    description: 'Shopping',
    note: 'New clothes',
    date: new Date('2024-01-12')
  },
  {
    amount: 75,
    type: 'expense',
    description: 'Entertainment',
    note: 'Movie tickets',
    date: new Date('2024-01-15')
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('🗑️ Clearing database...');
  await User.deleteMany({});
  await Category.deleteMany({});
  await Transaction.deleteMany({});
  await Report.deleteMany({});
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('👤 Seeding users...');
  
  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.email}`);
    } else {
      console.log(`⚠️ User already exists: ${userData.email}`);
    }
  }
}

async function seedCategories() {
  console.log('📂 Seeding categories...');
  
  const defaultCategories = Category.getDefaultCategories();
  
  for (const categoryData of defaultCategories) {
    const existingCategory = await Category.findOne({ name: categoryData.name });
    if (!existingCategory) {
      const category = new Category(categoryData);
      await category.save();
      console.log(`✅ Created category: ${category.name}`);
    } else {
      console.log(`⚠️ Category already exists: ${categoryData.name}`);
    }
  }
}

async function seedTransactions() {
  console.log('💰 Seeding transactions...');
  
  const users = await User.find();
  const categories = await Category.find();
  
  if (users.length === 0 || categories.length === 0) {
    console.log('⚠️ No users or categories found. Please seed users and categories first.');
    return;
  }
  
  const user = users[0]; // Use first user
  const incomeCategories = categories.filter(cat => ['income', 'both'].includes(cat.type));
  const expenseCategories = categories.filter(cat => ['expense', 'both'].includes(cat.type));
  
  for (const transactionData of sampleTransactions) {
    // Find appropriate category
    let category;
    if (transactionData.type === 'income') {
      category = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
    } else {
      category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    }
    
    const transaction = new Transaction({
      ...transactionData,
      user: user._id,
      category: category._id
    });
    
    await transaction.save();
    
    // Update category usage count
    await Category.findByIdAndUpdate(category._id, {
      $inc: { usageCount: 1 }
    });
    
    console.log(`✅ Created transaction: ${transaction.description}`);
  }
}

async function generateSampleReports() {
  console.log('📊 Generating sample reports...');
  
  const users = await User.find();
  if (users.length === 0) {
    console.log('⚠️ No users found. Please seed users first.');
    return;
  }
  
  const user = users[0];
  const currentDate = new Date();
  
  // Generate reports for last 3 months
  for (let i = 1; i <= 3; i++) {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
    
    try {
      const report = await Report.generateReport(user._id, startDate, endDate, 'monthly');
      console.log(`✅ Generated report for ${startDate.toISOString().split('T')[0]}`);
    } catch (error) {
      console.log(`⚠️ Failed to generate report for ${startDate.toISOString().split('T')[0]}: ${error.message}`);
    }
  }
}

async function seed() {
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    const clearFirst = args.includes('--clear');
    
    if (clearFirst) {
      await clearDatabase();
    }
    
    await seedUsers();
    await seedCategories();
    await seedTransactions();
    await generateSampleReports();
    
    console.log('🎉 Seeding completed successfully!');
    
    // Display summary
    const userCount = await User.countDocuments();
    const categoryCount = await Category.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const reportCount = await Report.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`👤 Users: ${userCount}`);
    console.log(`📂 Categories: ${categoryCount}`);
    console.log(`💰 Transactions: ${transactionCount}`);
    console.log(`📊 Reports: ${reportCount}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
if (require.main === module) {
  seed();
}

module.exports = { seed, clearDatabase, seedUsers, seedCategories, seedTransactions };
