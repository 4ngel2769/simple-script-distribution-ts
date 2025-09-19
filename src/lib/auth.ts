import bcrypt from 'bcrypt';
import { getConfig } from './db';

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const config = await getConfig();
  
  if (username !== config.admin.username) {
    return false;
  }
  
  return bcrypt.compare(password, config.admin.passwordHash);
}

// JS alternative to hash_password.go
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
