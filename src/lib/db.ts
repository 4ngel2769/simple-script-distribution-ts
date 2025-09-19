import fs from 'fs-extra';
import path from 'path';
import { Config, DEFAULT_CONFIG, ScriptConfig } from './config';

const CONFIG_PATH = process.env.CONFIG_PATH || path.join(process.cwd(), 'data/config.json');
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || path.join(process.cwd(), 'scripts');

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
  if (script.type === 'local') {
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
  if (!script) {
    throw new Error(`Script "${name}" not found`);
  }
  
  if (script.type !== 'local' || !script.scriptPath) {
    throw new Error(`Script "${name}" is not a local script or has no content`);
  }
  
  return fs.readFile(script.scriptPath, 'utf8');
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
