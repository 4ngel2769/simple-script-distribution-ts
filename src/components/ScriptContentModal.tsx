import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ScriptConfig } from '@/lib/config';
import Editor from '@monaco-editor/react';

interface ScriptContentModalProps {
  script: ScriptConfig;
  onClose: () => void;
}

export default function ScriptContentModal({ script, onClose }: ScriptContentModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`/api/scripts/${script.name}/content`);
        setContent(response.data.content);
      } catch (error) {
        console.error('Error fetching script content:', error);
        toast.error('Failed to load script content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [script]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await axios.put(`/api/scripts/${script.name}/content`, { content });
      toast.success('Script content saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving script content:', error);
      toast.error('Failed to save script content');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">
            Edit Content: {script.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-grow h-96 min-h-[400px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="shell"
              defaultValue={content}
              theme="vs-dark"
              onChange={(value) => setContent(value || '')}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          )}
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      </div>
    </div>
  );
}
