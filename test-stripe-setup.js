// Quick script to test Stripe configuration
// Run with: node test-stripe-setup.js

import 'dotenv/config';

console.log('🔍 Checking Stripe Configuration...\n');

const checks = [
  {
    name: 'STRIPE_SECRET_KEY',
    value: process.env.STRIPE_SECRET_KEY,
    valid: (val) => val && val.startsWith('sk_test_') || val.startsWith('sk_live_'),
    message: (val) => {
      if (!val) return '❌ Missing - Add STRIPE_SECRET_KEY to .env';
      if (!val.startsWith('sk_test_') && !val.startsWith('sk_live_')) {
        return '⚠️  Invalid format - Should start with sk_test_ or sk_live_';
      }
      return `✅ Found: ${val.substring(0, 12)}...`;
    }
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    value: process.env.STRIPE_PUBLISHABLE_KEY,
    valid: (val) => val && val.startsWith('pk_test_') || val.startsWith('pk_live_'),
    message: (val) => {
      if (!val) return '❌ Missing - Add STRIPE_PUBLISHABLE_KEY to .env';
      if (!val.startsWith('pk_test_') && !val.startsWith('pk_live_')) {
        return '⚠️  Invalid format - Should start with pk_test_ or pk_live_';
      }
      return `✅ Found: ${val.substring(0, 12)}...`;
    }
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    value: process.env.STRIPE_WEBHOOK_SECRET,
    valid: (val) => !val || val.startsWith('whsec_'),
    message: (val) => {
      if (!val) return '⚠️  Optional - Not set (OK for basic testing)';
      if (!val.startsWith('whsec_')) {
        return '⚠️  Invalid format - Should start with whsec_';
      }
      return `✅ Found: ${val.substring(0, 12)}...`;
    }
  }
];

let allValid = true;

checks.forEach(check => {
  const message = check.message(check.value);
  console.log(`${check.name}:`);
  console.log(`  ${message}\n`);
  
  if (!check.valid(check.value) && check.name !== 'STRIPE_WEBHOOK_SECRET') {
    allValid = false;
  }
});

if (allValid) {
  console.log('✅ All required Stripe keys are configured!\n');
  console.log('📝 Next steps:');
  console.log('   1. Start server: npm run dev');
  console.log('   2. Open http://localhost:5000/donate');
  console.log('   3. Enter amount and test with card: 4242 4242 4242 4242\n');
} else {
  console.log('❌ Please fix the issues above before testing.\n');
  console.log('📚 Get your keys from: https://dashboard.stripe.com/test/apikeys\n');
}
