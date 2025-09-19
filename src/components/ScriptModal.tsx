import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ScriptConfig } from '@/lib/config';

interface FolderEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface ScriptModalProps {
  script: ScriptConfig | null;
  onClose: () => void;
  onSave: (script: ScriptConfig) => void;
}

export default function ScriptModal({ script, onClose, onSave }: ScriptModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📜');
  const [type, setType] = useState<'local' | 'redirect'>('local');
  const [mode, setMode] = useState<'managed' | 'unmanaged'>('managed');
  const [folderPath, setFolderPath] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Folder explorer state
  const [showFolderExplorer, setShowFolderExplorer] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [folderEntries, setFolderEntries] = useState<FolderEntry[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Load script data if editing
  useEffect(() => {
    if (script) {
      setName(script.name);
      setDescription(script.description);
      setIcon(script.icon || '📜');
      setType(script.type);
      setMode(script.mode || 'managed');
      setFolderPath(script.folderPath || '');
      setRedirectUrl(script.redirectUrl || '');
    }
  }, [script]);

  // Load folders when explorer is opened
  useEffect(() => {
    if (showFolderExplorer) {
      loadFolders(currentPath);
    }
  }, [showFolderExplorer, currentPath]);

  const loadFolders = async (path: string) => {
    setLoadingFolders(true);
    try {
      const response = await axios.get(`/api/scripts/folders?path=${encodeURIComponent(path)}`);
      setFolderEntries(response.data);
    } catch (error) {
      toast.error('Failed to load folders');
      console.error('Error loading folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleFolderSelect = (entry: FolderEntry) => {
    if (entry.isDirectory) {
      setCurrentPath(entry.path);
    }
  };

  const handleFolderConfirm = () => {
    setFolderPath(currentPath);
    setShowFolderExplorer(false);
    setCurrentPath('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      toast.error('Script name is required');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (type === 'redirect' && !redirectUrl.trim()) {
      toast.error('Redirect URL is required for redirect type scripts');
      return;
    }

    if (type === 'local' && mode === 'unmanaged' && !folderPath.trim()) {
      toast.error('Folder path is required for unmanaged scripts');
      return;
    }
    
    // Prepare data
    const scriptData = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim() || '📜',
      type,
      mode: type === 'local' ? mode : undefined,
      folderPath: type === 'local' && mode === 'unmanaged' ? folderPath.trim() : undefined,
      redirectUrl: type === 'redirect' ? redirectUrl.trim() : undefined,
    };
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (script) {
        // Update existing script
        response = await axios.put(`/api/scripts/${script.name}`, scriptData);
      } else {
        // Create new script
        response = await axios.post('/api/scripts', scriptData);
      }
      
      toast.success(script ? 'Script updated successfully' : 'Script created successfully');
      onSave(response.data);
    } catch (error: unknown) {
      let message = 'Failed to save script';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        message = error.response.data.error;
      }
      toast.error(message);
      console.error('Error saving script:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">
            {script ? 'Edit Script' : 'Add New Script'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Script Name (URL path)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!script} // Disable name editing for existing scripts
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., install-docker"
              required
            />
            {!!script && (
              <p className="text-xs text-gray-400 mt-1">
                Script name cannot be changed after creation
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., Docker installation script"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Icon (emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., 🐳"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'local' | 'redirect')}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            >
              <option value="local">Local Script</option>
              <option value="redirect">Redirect to URL</option>
            </select>
          </div>

          {type === 'local' && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Script Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'managed' | 'unmanaged')}
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              >
                <option value="managed">Managed (Edit via web UI)</option>
                <option value="unmanaged">Unmanaged (File system)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {mode === 'managed' 
                  ? 'Script content is managed through the web interface'
                  : 'Script content is read from the newest .sh file in the selected folder'
                }
              </p>
            </div>
          )}

          {type === 'local' && mode === 'unmanaged' && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Folder Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white"
                  placeholder="e.g., tor"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowFolderExplorer(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white"
                >
                  Browse
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Path relative to scripts directory
              </p>
            </div>
          )}
          
          {type === 'redirect' && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Redirect URL</label>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                placeholder="e.g., https://raw.githubusercontent.com/..."
                required
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Script'}
            </button>
          </div>
        </form>
      </div>

      {/* Folder Explorer Modal */}
      {showFolderExplorer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white">Select Folder</h3>
              <button 
                onClick={() => setShowFolderExplorer(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-700">
              <p className="text-sm text-gray-300">Current path: /{currentPath || 'scripts'}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFolders ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                <div className="space-y-1">
                  {currentPath && (
                    <div
                      className="p-2 hover:bg-gray-700 rounded cursor-pointer text-blue-400"
                      onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/'))}
                    >
                      📁 ..
                    </div>
                  )}
                  {folderEntries
                    .filter(entry => entry.isDirectory)
                    .map((entry) => (
                      <div
                        key={entry.path}
                        className="p-2 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => handleFolderSelect(entry)}
                      >
                        📁 {entry.name}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 p-4 flex justify-end gap-2">
              <button
                onClick={() => setShowFolderExplorer(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleFolderConfirm}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Select Current Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
