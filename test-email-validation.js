/**
 * Email Validation Test
 *
 * This script tests the email validation logic to show which emails are valid/invalid
 */

// Simulate the validation function from email.service.ts
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim().toLowerCase();

  // Basic email format regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // List of dummy/invalid email patterns
  const dummyPatterns = [
    /^test@test\./,
    /^dummy@/,
    /^fake@/,
    /^noemail@/,
    /^no-email@/,
    /^example@example\./,
    /^user@example\./,
    /^admin@example\./,
    /@example\.com$/,
    /@example\.org$/,
    /@test\.com$/,
    /@dummy\.com$/,
    /@fake\.com$/,
    /^[0-9]+@/,     // Emails starting with only numbers (e.g., 123@domain.com)
    /^abc@/,        // Exactly abc@
    /^xyz@/,        // Exactly xyz@
    /^test\d*@/,    // test@, test1@, test123@, etc.
  ];

  // Check if email matches any dummy pattern
  for (const pattern of dummyPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  // Check for obviously invalid values (must start with these)
  const invalidStarts = [
    'n/a@',
    'na@',
    'none@',
    'null@',
    'undefined@',
  ];

  for (const invalid of invalidStarts) {
    if (email.startsWith(invalid)) {
      return false;
    }
  }

  // Check for missing username (email starts with @)
  if (email.startsWith('@')) {
    return false;
  }

  // Check for reasonable email length
  if (email.length < 5 || email.length > 254) {
    return false;
  }

  return true;
};

console.log('📧 Email Validation Test\n');
console.log('='.repeat(70));

// Test cases
const testEmails = [
  // Valid emails
  { email: 'john.doe@gmail.com', expected: true },
  { email: 'alice@company.org', expected: true },
  { email: 'bob123@yahoo.com', expected: true },
  { email: 'support@mycompany.io', expected: true },
  { email: 'user.name+tag@example.edu', expected: true },

  // Invalid - missing email
  { email: '', expected: false },
  { email: null, expected: false },
  { email: undefined, expected: false },

  // Invalid - wrong format
  { email: 'not-an-email', expected: false },
  { email: 'missing@domain', expected: false },
  { email: '@gmail.com', expected: false },
  { email: 'user@', expected: false },

  // Invalid - dummy emails
  { email: 'test@test.com', expected: false },
  { email: 'dummy@gmail.com', expected: false },
  { email: 'fake@mail.com', expected: false },
  { email: 'user@example.com', expected: false },
  { email: 'admin@example.org', expected: false },
  { email: 'noemail@gmail.com', expected: false },

  // Invalid - placeholder values
  { email: 'n/a@gmail.com', expected: false },
  { email: 'null@company.com', expected: false },
  { email: 'abc@gmail.com', expected: false },
  { email: '123@yahoo.com', expected: false },
];

let passed = 0;
let failed = 0;

testEmails.forEach((test, index) => {
  const result = isValidEmail(test.email);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  const emoji = result ? '✉️' : '🚫';

  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${status} ${emoji} "${test.email || '(empty)'}"`);
  console.log(`   Expected: ${test.expected}, Got: ${result}`);

  if (index < testEmails.length - 1) {
    console.log('');
  }
});

console.log('='.repeat(70));
console.log(`\n📊 Results: ${passed}/${testEmails.length} tests passed`);

if (failed > 0) {
  console.log(`⚠️  ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('🎉 All tests passed!');
}
