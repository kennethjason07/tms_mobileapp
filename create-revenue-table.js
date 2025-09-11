// Script to create the revenue_tracking table using Supabase client
const { supabase } = require('./supabase.js');

async function createRevenueTrackingTable() {
  console.log('🏗️ Creating revenue_tracking table...');
  
  try {
    // Read the SQL content
    const fs = require('fs');
    const path = require('path');
    const sqlContent = fs.readFileSync(path.join(__dirname, 'setup_revenue_tracking.sql'), 'utf8');
    
    // Remove comments and split by semicolon to execute each statement
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim() !== '')
      .map(stmt => stmt.trim());
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('\\d public.revenue_tracking')) {
        // Skip PostgreSQL-specific describe command
        console.log(`⏭️ Skipping PostgreSQL describe command`);
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Try using direct SQL execution if RPC doesn't work
          const { data: directData, error: directError } = await supabase
            .from('__dummy__') // This might not work but worth a try
            .select('1')
            .limit(0);
          
          if (directError) {
            console.log('⚠️ Cannot execute SQL directly via Supabase client');
            console.log('💡 Please run this SQL manually in Supabase dashboard:');
            console.log('📋 SQL to execute:');
            console.log(statement);
            console.log('');
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 Revenue tracking table creation process completed!');
    
    // Test if the table was created
    console.log('\n🔍 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('revenue_tracking')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Table not accessible via client, but may exist');
      console.log('💡 Please verify manually in Supabase dashboard');
      console.log('Error:', testError.message);
    } else {
      console.log('✅ Revenue tracking table is accessible!');
      console.log('🎯 Two-stage revenue system is now ready');
    }
    
  } catch (error) {
    console.error('❌ Error creating revenue tracking table:', error);
    console.log('\n💡 MANUAL SETUP REQUIRED:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of setup_revenue_tracking.sql');
    console.log('4. This will enable the two-stage revenue system');
  }
}

// Also provide a simpler table creation SQL
function showSimpleTableCreation() {
  console.log('\n📋 SIMPLE TABLE CREATION SQL (run in Supabase Dashboard):');
  console.log(`
CREATE TABLE IF NOT EXISTS public.revenue_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    bill_id BIGINT,
    customer_name TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'final')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    total_bill_amount DECIMAL(10,2) NOT NULL CHECK (total_bill_amount >= 0),
    remaining_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'recorded',
    advance_payment_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Create basic policy  
CREATE POLICY "Allow all operations on revenue_tracking"
ON public.revenue_tracking FOR ALL TO authenticated
USING (true) WITH CHECK (true);
`);
}

createRevenueTrackingTable().then(() => {
  showSimpleTableCreation();
}).catch(err => {
  console.error('Script failed:', err);
  showSimpleTableCreation();
});
