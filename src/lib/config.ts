export interface AdminConfig {
  username: string;
  passwordHash: string;
}

export interface ScriptConfig {
  name: string;
  description: string;
  icon: string;
  type: 'local' | 'redirect';
  redirectUrl?: string;
  scriptPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Config {
  admin: AdminConfig;
  scripts: ScriptConfig[];
}

export const DEFAULT_CONFIG: Config = {
  admin: {
    username: 'admin',
    // Default password hash for "admin123" - CHANGE THIS!
    passwordHash: '$2b$10$EYvzlm2Zyi4KSBTSod8tKeqGIVsNJrJX1UOwcJGJZMgqXwEjsMR1S',
  },
  scripts: [],
};
