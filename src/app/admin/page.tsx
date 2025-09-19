"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { ScriptConfig } from '@/lib/config';
import AdminLayout from '@/components/AdminLayoout';
import ScriptModal from '@/components/ScriptModal';
import ScriptContentModal from '@/components/ScriptContentModal';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [scripts, setScripts] = useState<ScriptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [currentScript, setCurrentScript] = useState<ScriptConfig | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load scripts
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await axios.get('/api/scripts');
        setScripts(response.data);
      } catch (error) {
        toast.error('Failed to load scripts');
        console.error('Error loading scripts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchScripts();
    }
  }, [status]);

  const handleAddScript = () => {
    setCurrentScript(null);
    setIsScriptModalOpen(true);
  };

  const handleEditScript = (script: ScriptConfig) => {
    setCurrentScript(script);
    setIsScriptModalOpen(true);
  };

  const handleEditContent = (script: ScriptConfig) => {
    if (script.mode === 'unmanaged') {
      toast.error('Cannot edit content of unmanaged scripts. Content is managed through the file system.');
      return;
    }
    setCurrentScript(script);
    setIsContentModalOpen(true);
  };

  const handleDeleteScript = async (script: ScriptConfig) => {
    if (!confirm(`Are you sure you want to delete the script "${script.name}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/scripts/${script.name}`);
      setScripts(scripts.filter(s => s.name !== script.name));
      toast.success('Script deleted successfully');
    } catch (error) {
      toast.error('Failed to delete script');
      console.error('Error deleting script:', error);
    }
  };

  const handleScriptSave = (savedScript: ScriptConfig) => {
    setIsScriptModalOpen(false);
    
    // Update script list
    const scriptIndex = scripts.findIndex(s => s.name === savedScript.name);
    if (scriptIndex >= 0) {
      // Update existing script
      const updatedScripts = [...scripts];
      updatedScripts[scriptIndex] = savedScript;
      setScripts(updatedScripts);
    } else {
      // Add new script
      setScripts([...scripts, savedScript]);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-400 flex items-center">
          <span className="mr-2">📜</span> Scripts Management
        </h1>
        <button
          onClick={handleAddScript}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Add New Script
        </button>
      </div>

      {scripts.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No scripts yet. Click &quot;Add New Script&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map((script) => (
            <div key={script.name} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl text-green-400 mb-2">
                {script.icon} {script.name}
              </h3>
              <p className="text-gray-300 mb-4">{script.description}</p>
              <div className="text-sm text-gray-400 mb-3 space-y-1">
                <p><strong>Type:</strong> {script.type}</p>
                {script.type === 'local' && (
                  <p><strong>Mode:</strong> {script.mode || 'managed'}</p>
                )}
                {script.type === 'local' && script.mode === 'unmanaged' && script.folderPath && (
                  <p><strong>Folder:</strong> {script.folderPath}</p>
                )}
                {script.type === 'redirect' && (
                  <a 
                    href={script.redirectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline block"
                  >
                    {script.redirectUrl}
                  </a>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEditScript(script)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                {script.type === 'local' && (
                  <button
                    onClick={() => handleEditContent(script)}
                    disabled={script.mode === 'unmanaged'}
                    className={`px-3 py-1 rounded text-white ${
                      script.mode === 'unmanaged'
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    title={script.mode === 'unmanaged' ? 'Unmanaged scripts cannot be edited via web UI' : 'Edit script content'}
                  >
                    Edit Content
                  </button>
                )}
                <button
                  onClick={() => handleDeleteScript(script)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Script Modal */}
      {isScriptModalOpen && (
        <ScriptModal
          script={currentScript}
          onClose={() => setIsScriptModalOpen(false)}
          onSave={handleScriptSave}
        />
      )}

      {/* Content Modal */}
      {isContentModalOpen && currentScript && (
        <ScriptContentModal
          script={currentScript}
          onClose={() => setIsContentModalOpen(false)}
        />
      )}
    </AdminLayout>
  );
}
