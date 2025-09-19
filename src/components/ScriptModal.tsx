import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ScriptConfig } from '@/lib/config';

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
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load script data if editing
  useEffect(() => {
    if (script) {
      setName(script.name);
      setDescription(script.description);
      setIcon(script.icon || '📜');
      setType(script.type);
      setRedirectUrl(script.redirectUrl || '');
    }
  }, [script]);

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
    
    // Prepare data
    const scriptData = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim() || '📜',
      type,
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
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
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
    </div>
  );
}
