import bcrypt from 'bcrypt';

async function hashPassword() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.log('Usage: node hash-password.js "your-password"');
    process.exit(1);
  }
  
  const password = args[0];
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log(`\nPassword hash for '${password}':\n${hash}\n`);
  } catch (error) {
    console.error('Error generating password hash:', error);
    process.exit(1);
  }
}

hashPassword();