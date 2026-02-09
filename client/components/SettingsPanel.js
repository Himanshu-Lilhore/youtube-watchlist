'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, ArrowUpDown } from 'lucide-react';
import { createTag, deleteTag, updateTag } from '../lib/api';

export default function SettingsPanel({
    isOpen,
    onClose,
    tags,
    onTagsChange,
    filters,
    setFilters,
    sortOrder,
    setSortOrder
}) {
    const [newTag, setNewTag] = useState('');
    const [editingTag, setEditingTag] = useState(null);
    const [editName, setEditName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleCreateTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;

        setIsSubmitting(true);
        try {
            await createTag(newTag.trim());
            setNewTag('');
            onTagsChange();
        } catch (error) {
            console.error('Failed to create tag', error);
            alert('Failed to create tag. It might already exist.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTag = async (id) => {
        if (!confirm('Delete this tag? It will be removed from all videos.')) return;
        try {
            await deleteTag(id);
            onTagsChange();
        } catch (error) {
            console.error('Failed to delete tag', error);
        }
    };

    const startEditing = (tag) => {
        setEditingTag(tag._id);
        setEditName(tag.name);
    };

    const handleUpdateTag = async (id) => {
        if (!editName.trim()) return;
        try {
            await updateTag(id, editName.trim());
            setEditingTag(null);
            onTagsChange();
        } catch (error) {
            console.error('Failed to update tag', error);
            alert('Failed to update tag.');
        }
    };

    const toggleTagFilter = (tagName) => {
        const newTags = filters.tags.includes(tagName)
            ? filters.tags.filter(t => t !== tagName)
            : [...filters.tags, tagName];
        setFilters({ ...filters, tags: newTags });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className="relative w-full sm:w-96 bg-slate-900 h-full shadow-2xl overflow-y-auto border-l border-slate-700 font-sans">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white">Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Section: Sort & Filter */}
                    <div className="mb-10">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">View Options</h3>

                        {/* Sort */}
                        <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setSortOrder('asc')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${sortOrder === 'asc' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <ArrowUpDown className="w-4 h-4" /> Normal
                            </button>
                            <button
                                onClick={() => setSortOrder('desc')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${sortOrder === 'desc' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                <ArrowUpDown className="w-4 h-4 transform rotate-180" /> Reverse
                            </button>
                        </div>

                        {/* Duration Filter */}
                        <div className="space-y-2 mb-4">
                            <label className="text-xs text-slate-400 font-medium">Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['all', 'short', 'medium', 'long'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilters({ ...filters, duration: type })}
                                        className={`px-2 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${filters.duration === type
                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 text-right">
                                Short (&lt;5m), Medium (5-20m), Long (&gt;20m)
                            </p>
                        </div>

                        {/* Tag Filters */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 font-medium">Filter by Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <button
                                        key={tag._id}
                                        onClick={() => toggleTagFilter(tag.name)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filters.tags.includes(tag.name)
                                                ? 'bg-purple-600 border-purple-500 text-white'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                                {tags.length === 0 && <span className="text-slate-600 text-xs italic">No tags created yet</span>}
                            </div>
                        </div>
                    </div>

                    {/* Section: Manage Tags */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Manage Global Tags</h3>

                        {/* Add Tag Form */}
                        <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="New tag name..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={!newTag.trim() || isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>

                        {/* Tag List */}
                        <div className="space-y-2">
                            {tags.map(tag => (
                                <div key={tag._id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 group">
                                    {editingTag === tag._id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateTag(tag._id)} className="text-green-500 hover:text-green-400">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingTag(null)} className="text-slate-500 hover:text-slate-400">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-slate-200 text-sm font-medium px-2">{tag.name}</span>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(tag)}
                                                    className="p-1.5 text-slate-500 hover:text-blue-400 rounded hover:bg-slate-700 transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTag(tag._id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-700 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {tags.length === 0 && (
                                <div className="text-center py-8 text-slate-600 text-sm">
                                    Create tags to organize your queue
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
