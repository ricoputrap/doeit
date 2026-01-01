/**
 * Database Verification Script
 *
 * This script verifies that the database was created correctly
 * and contains the expected schema and seed data.
 */

const fs = require('fs');
const path = require('path');

// Import sql.js
const initSqlJs = require('sql.js');

async function verifyDatabase() {
  console.log('🔍 Verifying Doeit database...\n');

  try {
    const dbPath = path.join(__dirname, '../../doeit.db');

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file not found at:', dbPath);
      return false;
    }

    const stats = fs.statSync(dbPath);
    console.log(`✅ Database file found: ${dbPath}`);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB\n`);

    // Initialize SQL.js
    const SQL = await initSqlJs({
      locateFile: (file) => {
        return require.resolve(`sql.js/dist/${file}`);
      }
    });

    // Load database
    const dbBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(dbBuffer);

    console.log('📋 Checking database schema...\n');

    // Check if all expected tables exist
    const tables = ['wallets', 'categories', 'savings_buckets', 'transactions', 'budgets'];
    let allTablesExist = true;

    for (const tableName of tables) {
      const result = db.exec(`
        SELECT COUNT(*) as count FROM sqlite_master
        WHERE type='table' AND name='${tableName}'
      `);

      const exists = result[0].values[0][0] > 0;
      console.log(`${exists ? '✅' : '❌'} Table '${tableName}': ${exists ? 'exists' : 'missing'}`);

      if (!exists) {
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      console.error('\n❌ Not all required tables exist!');
      db.close();
      return false;
    }

    console.log('\n📊 Checking seed data...\n');

    // Verify categories count
    const categoriesResult = db.exec(`
      SELECT type, COUNT(*) as count
      FROM categories
      GROUP BY type
      ORDER BY type
    `);

    const categoriesData = {};
    categoriesResult[0].values.forEach(row => {
      categoriesData[row[0]] = row[1];
    });

    console.log('📂 Categories:');
    console.log(`  ✅ Expense categories: ${categoriesData.expense || 0} (expected: 8)`);
    console.log(`  ✅ Income categories: ${categoriesData.income || 0} (expected: 5)`);

    const totalCategories = (categoriesData.expense || 0) + (categoriesData.income || 0);
    console.log(`  📊 Total categories: ${totalCategories} (expected: 13)`);

    // Check if we have the expected categories
    const expectedExpenseCategories = [
      'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
      'Entertainment', 'Healthcare', 'Education', 'Other Expense'
    ];

    const expectedIncomeCategories = [
      'Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'
    ];

    console.log('\n🔍 Verifying specific categories...\n');

    // Check expense categories
    console.log('Expense categories:');
    for (const categoryName of expectedExpenseCategories) {
      const result = db.exec(`
        SELECT COUNT(*) FROM categories
        WHERE name = ? AND type = 'expense'
      `, [categoryName]);

      const exists = result[0].values[0][0] > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${categoryName}`);
    }

    // Check income categories
    console.log('\nIncome categories:');
    for (const categoryName of expectedIncomeCategories) {
      const result = db.exec(`
        SELECT COUNT(*) FROM categories
        WHERE name = ? AND type = 'income'
      `, [categoryName]);

      const exists = result[0].values[0][0] > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${categoryName}`);
    }

    // Check database integrity
    console.log('\n🔧 Checking database integrity...\n');

    const integrityResult = db.exec('PRAGMA integrity_check');
    const isIntegrityOk = integrityResult[0].values[0][0] === 'ok';
    console.log(`${isIntegrityOk ? '✅' : '❌'} Database integrity: ${integrityResult[0].values[0][0]}`);

    // Check foreign keys
    const fkResult = db.exec('PRAGMA foreign_key_check');
    const fkViolations = fkResult[0]?.values?.length || 0;
    console.log(`${fkViolations === 0 ? '✅' : '⚠️'} Foreign key violations: ${fkViolations}`);

    // Close database
    db.close();

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(50));

    const allGood = allTablesExist &&
                   totalCategories === 13 &&
                   categoriesData.expense === 8 &&
                   categoriesData.income === 5 &&
                   isIntegrityOk &&
                   fkViolations === 0;

    if (allGood) {
      console.log('✅ Database verification: PASSED');
      console.log('🎉 Database is ready to use!');
    } else {
      console.log('❌ Database verification: FAILED');
      console.log('⚠️  Some issues were found - see details above');
    }

    console.log('='.repeat(50));

    return allGood;

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifyDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyDatabase };
