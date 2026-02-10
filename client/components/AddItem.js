'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AddItem({ onAdd, total }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        try {
            await onAdd(url, ['pending']);
            setUrl('');
        } catch (error) {
            console.error('Failed to add item', error);
            alert('Failed to add video. Please check the URL and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 w-full mx-auto">
            <div className="relative group w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-slate-900 rounded-2xl p-2 border border-slate-700 w-full">
                    <div className="flex gap-2 sm:gap-3 w-full">
                        <div className="flex-1 flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-4 min-w-0">
                            <span className="h-full border-r border-slate-700 pr-2 text-center flex items-center leading-none">
                                {total}
                            </span>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube URL here..."
                                className="flex-1 w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg leading-none"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                            className="px-3 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/50 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden md:inline">{loading ? 'Adding...' : 'Add'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
