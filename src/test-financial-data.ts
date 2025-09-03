import { 
  fetchFinancialData, 
  fetchMultipleFinancialData,
  getFinancialDataCacheStats,
  exportFinancialDataToCSV
} from './lib';

/**
 * Test the financial data system
 */
async function testFinancialDataSystem() {
  console.log('🚀 Testing Financial Data System...\n');

  try {
    // Test 1: Single company (JNJ)
    console.log('📊 Test 1: Fetching JNJ data...');
    const jnjData = await fetchFinancialData('JNJ');
    
    console.log('✅ JNJ Data Retrieved:');
    console.log({
      companyName: jnjData.companyName,
      ticker: jnjData.ticker,
      sector: jnjData.sector,
      industry: jnjData.industry,
      price: `$${jnjData.price}`,
      marketCap: `${(jnjData.marketCap / 1e9).toFixed(2)}B`,
      dividendYield: `${jnjData.dividendYield}%`,
      yearsIncreasingDividend: jnjData.yearsIncreasingDividend,
      chowderScore: jnjData.chowderScore
    });
    console.log('');

    // Test 2: Multiple companies
    console.log('📊 Test 2: Fetching multiple dividend kings...');
    const dividendKings = ['JNJ', 'PG', 'KO'];
    const allData = await fetchMultipleFinancialData(dividendKings);
    
    console.log('✅ Multiple Companies Retrieved:');
    Object.entries(allData).forEach(([ticker, data]) => {
      console.log(`${ticker}: ${data.companyName} - Yield: ${data.dividendYield}%, Years: ${data.yearsIncreasingDividend}, Chowder: ${data.chowderScore}`);
    });
    console.log('');

    // Test 3: Cache statistics
    console.log('📊 Test 3: Cache statistics...');
    const cacheStats = await getFinancialDataCacheStats();
    console.log('✅ Cache Stats:', {
      totalEntries: cacheStats.totalEntries,
      totalSize: `${(cacheStats.totalSize / 1024).toFixed(2)} KB`,
      oldestEntry: cacheStats.oldestEntry?.toLocaleDateString(),
      newestEntry: cacheStats.newestEntry?.toLocaleDateString()
    });
    console.log('');

    // Test 4: Export to CSV
    console.log('📊 Test 4: Exporting to CSV...');
    const companiesArray = Object.values(allData);
    const csvContent = await exportFinancialDataToCSV(companiesArray, './data/exported_companies.csv');
    
    console.log('✅ CSV Export Successful!');
    console.log('First few lines:');
    console.log(csvContent.split('\n').slice(0, 3).join('\n'));
    console.log('');

    console.log('🎉 All tests completed successfully!');
    return { jnjData, allData, cacheStats, csvContent };

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testFinancialDataSystem()
    .then(() => {
      console.log('\n✨ Financial data system is working perfectly!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testFinancialDataSystem };
