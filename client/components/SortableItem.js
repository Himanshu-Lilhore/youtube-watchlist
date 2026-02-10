'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowDown, CheckCircle2, ExternalLink } from 'lucide-react';
import { updateItemTags } from '../lib/api';

export function SortableItem({ id, item, onDeprioritize, onMarkWatched, availableTags, onItemUpdate, isDragEnabled = true }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item._id, disabled: !isDragEnabled });

    const [isTagMenuOpen, setIsTagMenuOpen] = React.useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

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
            ref={setNodeRef}
            style={style}
            className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 ${isDragging ? 'shadow-2xl scale-105 z-50' : 'hover:shadow-xl'} ${isTagMenuOpen ? 'z-40' : ''}`}
        >
            {/* Mobile & Desktop Layout */}
            <div className="flex flex-row items-center gap-2 p-2 sm:p-0">
                {/* Drag Handle */}
                {isDragEnabled && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing flex-shrink-0 sm:absolute sm:top-3 sm:left-3 sm:z-10 sm:bg-slate-900/80 sm:backdrop-blur-sm p-1.5 sm:p-2 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    </div>
                )}

                {/* Thumbnail */}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-24 aspect-[4/3] sm:w-full sm:h-48 md:w-80 md:h-44 flex-shrink-0 overflow-hidden bg-black rounded-lg sm:rounded-none"
                // Prevent drag handle from catching clicks on thumbnail if needed, but 'a' tag handles it
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
                            <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-white truncate sm:line-clamp-2 leading-tight flex-1">
                                {item.title}
                            </h3>
                            <div className="flex-shrink-0 sm:absolute sm:top-3 sm:right-3 sm:z-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                                #{item.rank}
                            </div>
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2 sm:mb-4 items-center">
                        {item.status && (
                            <div className="sm:hidden">
                                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold rounded-full">
                                    {item.status}
                                </span>
                            </div>
                        )}

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
                <div className="hidden sm:flex items-center gap-3 pr-2">
                    <button
                        onClick={() => onMarkWatched(item._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden md:inline">Watched</span>
                    </button>

                    <button
                        onClick={() => onDeprioritize(item._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
                    >
                        <ArrowDown className="w-4 h-4" />
                        <span className="hidden md:inline">Later</span>
                    </button>
                </div>
            </div>

            {/* 👇 UPDATED Mobile Actions: Flex Row + Labels */}
            <div className="sm:hidden flex flex-row gap-2 p-2 pt-0 w-full">
                <button
                    onClick={() => onMarkWatched(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg font-medium text-sm"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Watched</span>
                </button>

                <button
                    onClick={() => onDeprioritize(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all shadow-md font-medium text-sm"
                >
                    <ArrowDown className="w-4 h-4" />
                    <span>Later</span>
                </button>
            </div>
        </div>
    );
}