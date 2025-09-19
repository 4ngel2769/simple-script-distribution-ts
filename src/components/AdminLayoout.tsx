import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <span className="text-2xl">⚙️</span> Script Server Admin
          </Link>
          
          {session && (
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-400">
                Logged in as <strong>{session.user?.name}</strong>
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
      
      <footer className="border-t border-gray-800 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Script Distribution Server - Admin Dashboard</p>
        </div>
      </footer>
    </div>
  );
}
