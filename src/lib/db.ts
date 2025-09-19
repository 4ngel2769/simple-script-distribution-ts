import fs from 'fs-extra';
import path from 'path';
import { Config, DEFAULT_CONFIG, ScriptConfig } from './config';

const CONFIG_PATH = process.env.CONFIG_PATH || path.join(process.cwd(), 'data/config.json');
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || path.join(process.cwd(), 'scripts');

// Reserved names that scripts cannot use
const RESERVED_NAMES = [
  'admin',
  'login', 
  'api',
  'health',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
];

// Ensure directories exist
fs.ensureDirSync(path.dirname(CONFIG_PATH));
fs.ensureDirSync(SCRIPTS_DIR);

// Get config or initialize with default values
export async function getConfig(): Promise<Config> {
  try {
    if (await fs.pathExists(CONFIG_PATH)) {
      const config = await fs.readJson(CONFIG_PATH);
      return config;
    }
    // Initialize with default config
    await fs.writeJson(CONFIG_PATH, DEFAULT_CONFIG, { spaces: 2 });
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

// Save config
export async function saveConfig(config: Config): Promise<void> {
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

// Validate script name
export function validateScriptName(name: string): void {
  const normalizedName = name.toLowerCase().trim();
  
  if (RESERVED_NAMES.includes(normalizedName)) {
    throw new Error(`Script name "${name}" is reserved and cannot be used`);
  }
  
  // Additional validation rules
  if (!/^[a-z0-9_-]+$/.test(normalizedName)) {
    throw new Error('Script name can only contain lowercase letters, numbers, hyphens, and underscores');
  }
  
  if (normalizedName.length < 2 || normalizedName.length > 50) {
    throw new Error('Script name must be between 2 and 50 characters');
  }
}

// SCRIPT OPERATIONS

// Get all scripts
export async function getAllScripts(): Promise<ScriptConfig[]> {
  const config = await getConfig();
  return config.scripts;
}

// Get script by name
export async function getScriptByName(name: string): Promise<ScriptConfig | null> {
  const config = await getConfig();
  return config.scripts.find(script => script.name === name) || null;
}

// Create script
export async function createScript(script: Omit<ScriptConfig, 'createdAt' | 'updatedAt'>): Promise<ScriptConfig> {
  const config = await getConfig();
  
  // Validate script name
  validateScriptName(script.name);
  
  // Check if script already exists
  if (config.scripts.some(s => s.name === script.name)) {
    throw new Error(`Script "${script.name}" already exists`);
  }
  
  const timestamp = new Date().toISOString();
  const newScript: ScriptConfig = {
    ...script,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  // Handle local script creation
  if (script.type === 'local' && script.mode !== 'unmanaged') {
    const scriptDir = path.join(SCRIPTS_DIR, script.name);
    fs.ensureDirSync(scriptDir);
    
    // Create default script content if path not specified
    if (!script.scriptPath) {
      const scriptFile = path.join(scriptDir, `${script.name}.sh`);
      const defaultContent = [
        '#!/bin/bash',
        '',
        `# ${script.description}`,
        `# Generated on ${new Date().toLocaleString()}`,
        '',
        `echo "Hello from ${script.name} script!"`,
        'echo "Replace this content with your actual script."',
      ].join('\n');
      
      await fs.writeFile(scriptFile, defaultContent, { mode: 0o755 });
      newScript.scriptPath = scriptFile;
    }
  }
  
  config.scripts.push(newScript);
  await saveConfig(config);
  return newScript;
}

// Update script
export async function updateScript(name: string, updates: Partial<ScriptConfig>): Promise<ScriptConfig> {
  const config = await getConfig();
  const scriptIndex = config.scripts.findIndex(s => s.name === name);
  
  if (scriptIndex === -1) {
    throw new Error(`Script "${name}" not found`);
  }
  
  const updatedScript: ScriptConfig = {
    ...config.scripts[scriptIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  config.scripts[scriptIndex] = updatedScript;
  await saveConfig(config);
  return updatedScript;
}

// Delete script
export async function deleteScript(name: string): Promise<void> {
  const config = await getConfig();
  const scriptIndex = config.scripts.findIndex(s => s.name === name);
  
  if (scriptIndex === -1) {
    throw new Error(`Script "${name}" not found`);
  }
  
  // If local script, delete files
  const script = config.scripts[scriptIndex];
  if (script.type === 'local' && script.scriptPath) {
    try {
      await fs.remove(path.dirname(script.scriptPath));
    } catch (error) {
      console.error(`Error deleting script files: ${error}`);
    }
  }
  
  config.scripts.splice(scriptIndex, 1);
  await saveConfig(config);
}

// Get script content
export async function getScriptContent(name: string): Promise<string> {
  const script = await getScriptByName(name);
  if (!script) throw new Error(`Script "${name}" not found`);

  if (script.type !== 'local') throw new Error(`Script "${name}" is not a local script`);

  // Managed: use scriptPath as before
  if (script.mode !== 'unmanaged' && script.scriptPath) {
    return fs.readFile(script.scriptPath, 'utf8');
  }

  // Unmanaged: find newest .sh file in folderPath
  if (script.mode === 'unmanaged' && script.folderPath) {
    const folder = path.isAbsolute(script.folderPath)
      ? script.folderPath
      : path.join(SCRIPTS_DIR, script.folderPath);

    const files = (await fs.readdir(folder))
      .filter(f => f.endsWith('.sh'))
      .map(f => ({
        file: f,
        mtime: fs.statSync(path.join(folder, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) throw new Error('No .sh files found in folder');

    const newestFile = path.join(folder, files[0].file);
    return fs.readFile(newestFile, 'utf8');
  }

  throw new Error('Script content not found');
}

// Update script content
export async function updateScriptContent(name: string, content: string): Promise<void> {
  const script = await getScriptByName(name);
  if (!script) {
    throw new Error(`Script "${name}" not found`);
  }
  
  if (script.type !== 'local' || !script.scriptPath) {
    throw new Error(`Script "${name}" is not a local script or has no content`);
  }
  
  await fs.writeFile(script.scriptPath, content, { mode: 0o755 });
  await updateScript(name, { updatedAt: new Date().toISOString() });
}
