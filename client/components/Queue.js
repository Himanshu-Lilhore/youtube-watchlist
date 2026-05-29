'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    arrayMove
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import AddItem from './AddItem';
import { fetchItems, addItem, reorderItems, deprioritizeItem, markAsWatched, fetchTags, fetchPreferences, savePreferences } from '../lib/api';
import { Video, Settings, X, Filter } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

const PAGE_SIZE = 10; // how many items to reveal per scroll

export default function Queue() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState([]); // Global tags
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Filter & Sort State
    const [filters, setFilters] = useState({ duration: 'all', tags: [] });
    const [sortOrder, setSortOrder] = useState('asc');

    // Infinite scroll state — how many items are currently revealed
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef(null);

    // Track whether server-side prefs have been loaded yet so we don't
    // overwrite them with the initial defaults on first render.
    const [prefsLoaded, setPrefsLoaded] = useState(false);



    useEffect(() => {
        loadData();
    }, []);

    // Reset the visible window when filters or sort change
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filters.duration, filters.tags, sortOrder]);

    // Infinite-scroll: reveal more items when the sentinel enters the viewport
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleCount((c) => c + PAGE_SIZE);
                }
            },
            { rootMargin: '200px' } // trigger a bit before the sentinel is fully visible
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [items, filters.duration, filters.tags, sortOrder, visibleCount]);

    const loadData = async () => {
        try {
            const [itemsData, tagsData, prefsData] = await Promise.all([
                fetchItems(),
                fetchTags(),
                fetchPreferences().catch((e) => {
                    console.warn('Could not load preferences, using defaults', e);
                    return null;
                })
            ]);
            setItems(itemsData);
            setTags(tagsData);
            if (prefsData) {
                if (prefsData.filters) {
                    setFilters({
                        duration: prefsData.filters.duration || 'all',
                        tags: Array.isArray(prefsData.filters.tags) ? prefsData.filters.tags : []
                    });
                }
                if (prefsData.sortOrder) setSortOrder(prefsData.sortOrder);
            }
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setPrefsLoaded(true);
            setLoading(false);
        }
    };

    // Persist filter/sort changes to the server (debounced) once prefs have loaded.
    useEffect(() => {
        if (!prefsLoaded) return;
        const t = setTimeout(() => {
            savePreferences({ filters, sortOrder }).catch((err) =>
                console.warn('Failed to save preferences', err)
            );
        }, 400);
        return () => clearTimeout(t);
    }, [filters.duration, filters.tags, sortOrder, prefsLoaded]);

    const handleTagsChange = async () => {
        const newTags = await fetchTags();
        setTags(newTags);
    };

    // --- Filter & Sort Logic ---
    const getFilteredItems = () => {
        let result = [...items];

        // 1. Filter by Duration
        if (filters.duration !== 'all') {
            result = result.filter(item => {
                if (!item.duration) return false; // Exclude items without duration if filtering
                const [min, sec] = item.duration.split(':').map(Number);
                const totalMinutes = min + (sec / 60);

                // Handle hour case "H:MM:SS" ?? 
                // Wait, my duration parsing in items.js produces "MM:SS" or "H:MM:SS"
                // Let's parse robustly
                const parts = item.duration.split(':').map(Number);
                let durationSteps = 0;
                if (parts.length === 3) {
                    durationSteps = parts[0] * 60 + parts[1]; // hours * 60 + min
                } else {
                    durationSteps = parts[0]; // min
                }

                if (filters.duration === 'short') return durationSteps < 5;
                if (filters.duration === 'medium') return durationSteps >= 5 && durationSteps <= 20;
                if (filters.duration === 'long') return durationSteps > 20;
                return true;
            });
        }

        // 2. Filter by Tags (OR logic - item must match at least one selected tag)
        if (filters.tags.length > 0) {
            result = result.filter(item =>
                item.tags.some(tag => filters.tags.includes(tag))
            );
        }

        // 3. Sort
        if (sortOrder === 'desc') {
            result.reverse();
        }

        return result;
    };

    const filteredItems = getFilteredItems();
    const isFiltered = filters.duration !== 'all' || filters.tags.length > 0 || sortOrder === 'desc';

    const handleAdd = async (url, tags) => {
        const newItem = await addItem(url, tags);
        setItems((prev) => [...prev, newItem]);
    };

    const updateRanks = async (reorderedItems) => {
        const itemsWithUpdatedRanks = reorderedItems.map((item, index) => ({
            ...item,
            rank: index + 1
        }));

        setItems(itemsWithUpdatedRanks);

        const rankUpdates = itemsWithUpdatedRanks.map((item) => ({
            _id: item._id,
            rank: item.rank
        }));

        try {
            await reorderItems(rankUpdates);
        } catch (error) {
            console.error("Failed to update ranks", error);
        }
    };

    const handleMoveToTop = (id) => {
        const index = items.findIndex(i => i._id === id);
        if (index <= 0) return;
        const newItems = arrayMove(items, index, 0);
        updateRanks(newItems);
    };

    const handleMoveUp = (id) => {
        const index = items.findIndex(i => i._id === id);
        if (index <= 0) return;
        const newItems = arrayMove(items, index, index - 1);
        updateRanks(newItems);
    };

    const handleMoveDown = (id) => {
        const index = items.findIndex(i => i._id === id);
        if (index === -1 || index === items.length - 1) return;
        const newItems = arrayMove(items, index, index + 1);
        updateRanks(newItems);
    };

    const handleMoveToBottom = (id) => {
        const index = items.findIndex(i => i._id === id);
        if (index === -1 || index === items.length - 1) return;
        const newItems = arrayMove(items, index, items.length - 1);
        updateRanks(newItems);
    };

    const handleDeprioritize = async (id) => {
        try {
            await deprioritizeItem(id);
            // Reload items to get fresh rank order from server? 
            // Or just move it locally. 'deprioritizeItem' endpoint puts it at end.
            // Let's reload to be safe and consistent
            const data = await fetchItems();
            setItems(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkWatched = async (id) => {
        try {
            await markAsWatched(id);
            setItems(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleItemUpdate = (updatedItem) => {
        setItems(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                    <p className="text-slate-400 text-lg">Loading your queue...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-2 sm:mb-4 relative flex flex-row justify-between items-center sm:items-start">
                <div className="inline-block">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-50 pointer-events-none"></div>
                        <h1 className="relative text-[43px] sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center">
                            WatchQueue
                        </h1>
                    </div>
                </div>
                <div className="block">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors shadow-lg"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Add Item Form */}
            <AddItem onAdd={handleAdd} total={items.length} />

            {/* Active Filters bar */}
            {(filters.duration !== 'all' || filters.tags.length > 0 || sortOrder !== 'asc') && (
                <div className="mb-4 flex flex-wrap items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-2xl px-3 py-2">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider mr-1">
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                    </div>

                    {filters.duration !== 'all' && (
                        <button
                            onClick={() => setFilters({ ...filters, duration: 'all' })}
                            className="group flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                            title="Clear duration filter"
                        >
                            <span className="capitalize">Duration: {filters.duration}</span>
                            <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </button>
                    )}

                    {filters.tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setFilters({ ...filters, tags: filters.tags.filter(t => t !== tag) })}
                            className="group flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                            title={`Remove tag "${tag}"`}
                        >
                            <span>#{tag}</span>
                            <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </button>
                    ))}

                    {sortOrder !== 'asc' && (
                        <button
                            onClick={() => setSortOrder('asc')}
                            className="group flex items-center gap-1.5 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/60 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                            title="Reset sort order"
                        >
                            <span>Sort: reverse</span>
                            <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setFilters({ duration: 'all', tags: [] });
                            setSortOrder('asc');
                        }}
                        className="ml-auto text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Queue List (infinite scroll) */}
            {(() => {
                const visibleItems = items
                    .filter(item => {
                        if (filters.duration !== 'all') {
                            if (!item.duration) return false;
                            const parts = item.duration.split(':').map(Number);
                            let durationSteps = 0;
                            if (parts.length === 3) durationSteps = parts[0] * 60 + parts[1];
                            else durationSteps = parts[0];

                            if (filters.duration === 'short' && durationSteps >= 5) return false;
                            if (filters.duration === 'medium' && (durationSteps < 5 || durationSteps > 20)) return false;
                            if (filters.duration === 'long' && durationSteps <= 20) return false;
                        }
                        if (filters.tags.length > 0) {
                            if (!item.tags.some(tag => filters.tags.includes(tag))) return false;
                        }
                        return true;
                    })
                    .sort((a, b) => {
                        if (sortOrder === 'desc') return b.rank - a.rank;
                        return a.rank - b.rank;
                    });

                const shown = Math.min(visibleCount, visibleItems.length);
                const pageItems = visibleItems.slice(0, shown);
                const hasMore = shown < visibleItems.length;

                return (
                    <>
                        <div className="space-y-4">
                            {pageItems.map((item, index, array) => (
                                <SortableItem
                                    key={item._id}
                                    id={item._id}
                                    item={item}
                                    onDeprioritize={handleDeprioritize}
                                    onMarkWatched={handleMarkWatched}
                                    availableTags={tags}
                                    onItemUpdate={handleItemUpdate}
                                    // Reordering Props
                                    onMoveToTop={() => handleMoveToTop(item._id)}
                                    onMoveUp={() => handleMoveUp(item._id)}
                                    onMoveDown={() => handleMoveDown(item._id)}
                                    onMoveToBottom={() => handleMoveToBottom(item._id)}
                                    isFirst={index === 0}
                                    isLast={index === array.length - 1 && !hasMore}
                                />
                            ))}
                            {visibleItems.length === 0 && items.length > 0 && (
                                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-700">
                                    <h3 className="text-xl font-bold text-slate-400 mb-2">No matches found</h3>
                                    <p className="text-slate-500">Try adjusting your filters</p>
                                </div>
                            )}
                        </div>

                        {/* Sentinel: when it scrolls into view, reveal more items */}
                        {hasMore && (
                            <div ref={sentinelRef} className="flex items-center justify-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-slate-400 text-sm">Loading more…</span>
                            </div>
                        )}

                        {!hasMore && visibleItems.length > PAGE_SIZE && (
                            <div className="text-center text-slate-500 text-sm py-6">
                                You've reached the end · {visibleItems.length} items
                            </div>
                        )}
                    </>
                );
            })()}

            {/* Empty State (Only if truly empty, not valid for filtered 0 state) */}
            {items.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-700">
                    <Video className="w-20 h-20 mx-auto mb-6 text-slate-600" />
                    <h3 className="text-2xl font-bold text-slate-300 mb-2">Your queue is empty</h3>
                    <p className="text-slate-500 text-lg">Add your first video to get started!</p>
                </div>
            )}

            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                tags={tags}
                onTagsChange={handleTagsChange}
                filters={filters}
                setFilters={setFilters}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />
        </div>
    );
}
