'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowDown, CheckCircle2, ExternalLink } from 'lucide-react';

export function SortableItem({ id, item, onDeprioritize, onMarkWatched }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 ${isDragging ? 'shadow-2xl scale-105 z-50' : 'hover:shadow-xl'}`}
        >
            {/* Drag Handle - Top Corner */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-3 left-3 z-10 cursor-grab active:cursor-grabbing bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="w-5 h-5 text-slate-400" />
            </div>

            {/* Rank Badge */}
            <div className="absolute top-3 right-3 z-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                #{item.rank}
            </div>

            {/* Main Content */}
            <div className="flex flex-col md:flex-row">
                {/* Thumbnail - Large and Prominent */}
                <div className="relative w-full md:w-80 h-48 md:h-44 flex-shrink-0 overflow-hidden bg-black">
                    {item.thumbnail ? (
                        <>
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                            <div className="text-slate-600 text-6xl">▶</div>
                        </div>
                    )}

                    {/* Play Button Overlay */}
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                    >
                        <div className="bg-red-600 rounded-full p-4 transform group-hover:scale-110 transition-transform shadow-2xl">
                            <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                    </a>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                    {/* Title and Tags */}
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight">
                            {item.title}
                        </h3>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onMarkWatched(item._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Watched</span>
                        </button>

                        <button
                            onClick={() => onDeprioritize(item._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                        >
                            <ArrowDown className="w-4 h-4" />
                            <span className="hidden sm:inline">Later</span>
                        </button>

                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
