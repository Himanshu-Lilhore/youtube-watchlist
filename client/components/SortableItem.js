'use client';

import React from 'react';

import { CheckCircle2, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react';
import { updateItemTags } from '../lib/api';

export function SortableItem({ id, item, onDeprioritize, onMarkWatched, availableTags, onItemUpdate, onMoveToTop, onMoveUp, onMoveDown, onMoveToBottom, isFirst, isLast }) {

    const [isTagMenuOpen, setIsTagMenuOpen] = React.useState(false);

    const handleAddTag = async (tagName) => {
        if (item.tags.includes(tagName)) return;
        const newTags = [...item.tags, tagName];

        try {
            const updatedItem = await updateItemTags(item._id, newTags);
            onItemUpdate(updatedItem);
            setIsTagMenuOpen(false);
        } catch (error) {
            console.error('Failed to add tag', error);
        }
    };

    const handleRemoveTag = async (tagName) => {
        const newTags = item.tags.filter(t => t !== tagName);
        try {
            const updatedItem = await updateItemTags(item._id, newTags);
            // Optimistically update or wait?
            // onItemUpdate will update the parent state which re-renders this component
            onItemUpdate(updatedItem);
        } catch (error) {
            console.error('Failed to remove tag', error);
        }
    };

    // Filter tags that are NOT already on the item
    const tagsToAdd = availableTags ? availableTags.filter(t => !item.tags.includes(t.name)) : [];

    return (
        <div
            className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-visible border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl ${isTagMenuOpen ? 'z-40' : ''} flex`}
        >
            {/* Reorder Controls - Full Height */}
            <div className="flex flex-col self-stretch justify-between py-2 pl-1 sm:py-2 sm:px-2 items-center z-10">
                <button
                    onClick={onMoveToTop}
                    disabled={isFirst}
                    className={`p-1 rounded-md transition-colors ${isFirst ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'}`}
                    title="Move to Top"
                >
                    <ChevronsUp className="w-4 aspect-square" />
                </button>
                <button
                    onClick={onMoveUp}
                    disabled={isFirst}
                    className={`p-1 rounded-md transition-colors ${isFirst ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'}`}
                    title="Move Up"
                >
                    <ChevronUp className="w-4 aspect-square" />
                </button>
                <button
                    onClick={onMoveDown}
                    disabled={isLast}
                    className={`p-1 rounded-md transition-colors ${isLast ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-orange-500 hover:bg-slate-700/50'}`}
                    title="Move Down"
                >
                    <ChevronDown className="w-4 aspect-square" />
                </button>
                <button
                    onClick={onMoveToBottom}
                    disabled={isLast}
                    className={`p-1 rounded-md transition-colors ${isLast ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-orange-500 hover:bg-slate-700/50'}`}
                    title="Move to Bottom"
                >
                    <ChevronsDown className="w-4 aspect-square" />
                </button>
            </div>

            {/* Content Wrapper */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Mobile & Desktop Layout - Main Content Row */}
                <div className="flex flex-col sm:flex-row items-start gap-2 p-2 sm:p-0">
                    {/* Thumbnail */}
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-[4/3] w-40 sm:h-48 md:w-80 flex-shrink-0 overflow-hidden bg-black rounded-lg sm:rounded-none"
                    >
                        {item.thumbnail ? (
                            <>
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent hidden sm:block" />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                <div className="text-slate-600 text-2xl sm:text-6xl">▶</div>
                            </div>
                        )}
                        {item.duration && (
                            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/80 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md">
                                {item.duration}
                            </div>
                        )}
                    </a>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 sm:p-5 flex flex-col justify-between">
                        <div className="mb-2 sm:mb-0">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 mb-1 sm:mb-3 sm:pointer-events-none"
                            >
                                <h3 className="text-sm sm:text-xl md:text-2xl font-semibold text-white line-clamp-2 leading-tight flex-1">
                                    <span className="text-gray-500/70">
                                        #{item.rank}
                                    </span>{"  "}
                                    {item.title}
                                </h3>
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2 sm:mb-4 items-center">
                            {item.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="group/tag inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold rounded-full"
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hidden group-hover/tag:block hover:text-red-400 focus:outline-none"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}

                            {/* Add Tag Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                                    className="px-2 py-1 bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-400 hover:text-white text-xs rounded-full transition-colors"
                                >
                                    +
                                </button>

                                {isTagMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsTagMenuOpen(false)}
                                        ></div>
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                            <div className="p-1">
                                                {tagsToAdd.length > 0 ? (
                                                    tagsToAdd.map(tag => (
                                                        <button
                                                            key={tag._id}
                                                            onClick={() => handleAddTag(tag.name)}
                                                            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors"
                                                        >
                                                            {tag.name}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-xs text-slate-500 text-center">
                                                        No available tags.<br />Create more in Settings.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions - Desktop layout */}
                    <div className="h-full hidden sm:flex items-end gap-3 pr-2 pb-2">
                        <button
                            onClick={() => onMarkWatched(item._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden md:inline">Watched</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Actions: Flex Row + Labels */}
                <div className="sm:hidden flex flex-row gap-2 p-2 pt-0 w-full">
                    <button
                        onClick={() => onMarkWatched(item._id)}
                        className="flex-1 flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg font-medium text-sm"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Watched</span>
                    </button>
                </div>
            </div>
        </div>
    );
}