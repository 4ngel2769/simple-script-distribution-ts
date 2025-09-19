"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ScriptConfig } from '@/lib/config';
import { toast, Toaster } from 'react-hot-toast';

export default function HomePage() {
  const [scripts, setScripts] = useState<ScriptConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Get domain for curl commands
  const domain = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await axios.get('/api/scripts');
        setScripts(response.data);
      } catch (error) {
        console.error('Error fetching scripts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Command copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Toaster position="bottom-right" />
      
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-2 mb-8 pb-2 border-b border-gray-700">
          <span className="text-2xl">🚀</span> Script Server
        </h1>

        {loading ? (
          <div className="animate-pulse p-6 bg-gray-800 rounded-lg">
            Loading scripts...
          </div>
        ) : scripts.length === 0 ? (
          <div className="p-6 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No scripts available yet.</p>
            <Link 
              href="/admin" 
              className="mt-4 inline-block text-sm text-blue-400 hover:underline"
            >
              Admin Login
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-2">Available script endpoints:</p>
            <p className="text-sm text-gray-400 mb-6">💡 Click any endpoint to copy the curl command to clipboard</p>
            
            <div className="space-y-3 mb-8">
              {scripts.map(script => (
                <div
                  key={script.name}
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer transition hover:border-blue-500 hover:translate-x-1"
                  onClick={() => copyToClipboard(`curl -fsSL ${domain}/${script.name} | sudo bash`)}
                >
                  <span className="mr-2">{script.icon || '📜'}</span>
                  <span className="text-green-400">/{script.name}</span> - {script.description}
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg mb-8">
              <h3 className="text-xl text-yellow-500 mb-4 font-semibold">
                <span className="mr-2">📖</span> Usage Examples
              </h3>
              
              <p className="mb-1">Direct download:</p>
              <pre 
                className="bg-gray-900 p-2 rounded cursor-pointer mb-4"
                onClick={() => copyToClipboard(`curl ${domain}/script-name`)}
              >
                curl {domain}/script-name
              </pre>
              
              <p className="mb-1">Download and execute:</p>
              <pre 
                className="bg-gray-900 p-2 rounded cursor-pointer mb-4"
                onClick={() => copyToClipboard(`curl -fsSL ${domain}/script-name | sudo bash`)}
              >
                curl -fsSL {domain}/script-name | sudo bash
              </pre>
              
              <p className="mb-1">Save to file:</p>
              <pre 
                className="bg-gray-900 p-2 rounded cursor-pointer"
                onClick={() => copyToClipboard(`curl -o install.sh ${domain}/script-name`)}
              >
                curl -o install.sh {domain}/script-name
              </pre>
            </div>
            
            <div className="text-gray-500 pt-4 border-t border-gray-700">
              <p className="flex items-center">
                <span className="mr-2">🔗</span> Health check: 
                <span 
                  className="ml-2 bg-gray-800 px-2 py-1 rounded text-sm cursor-pointer"
                  onClick={() => copyToClipboard(`curl ${domain}/api/health`)}
                >
                  /api/health
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
