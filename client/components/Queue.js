'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import AddItem from './AddItem';
import { fetchItems, addItem, reorderItems, deprioritizeItem, markAsWatched, fetchTags } from '../lib/api';
import { Video, Settings } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

export default function Queue() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState([]); // Global tags
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Filter & Sort State
    const [filters, setFilters] = useState({ duration: 'all', tags: [] });
    const [sortOrder, setSortOrder] = useState('asc');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [itemsData, tagsData] = await Promise.all([
                fetchItems(),
                fetchTags()
            ]);
            setItems(itemsData);
            setTags(tagsData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                const rankUpdates = newItems.map((item, index) => ({
                    _id: item._id,
                    rank: index + 1
                }));

                reorderItems(rankUpdates).catch(console.error);

                return newItems;
            });
        }
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
            <div className="text-center mb-12 relative">
                <div className="absolute top-0 right-0 z-50">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors shadow-lg"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                <div className="inline-block mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-50 pointer-events-none"></div>
                        <h1 className="relative text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center">
                            WatchQueue
                            <span className="text-xl sm:text-3xl bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 shadow-lg mt-2 sm:mt-0">
                                {items.length}
                            </span>
                        </h1>
                    </div>
                </div>
                <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto">
                    Curate, organize, and never miss the videos that matter
                </p>
            </div>

            {/* Add Item Form */}
            <AddItem onAdd={handleAdd} />

            {/* Queue List */}
            {isFiltered ? (
                // Render list WITHOUT Drag & Drop if filtered
                <div className="space-y-4">
                    {filteredItems.map((item) => (
                        <SortableItem
                            key={item._id}
                            id={item._id}
                            item={item}
                            onDeprioritize={handleDeprioritize}
                            onMarkWatched={handleMarkWatched}
                            availableTags={tags} // Pass global tags
                            onItemUpdate={handleItemUpdate} // Callback to update item state
                            isDragEnabled={false}
                        />
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-700">
                            <h3 className="text-xl font-bold text-slate-400 mb-2">No matches found</h3>
                            <p className="text-slate-500">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={filteredItems.map(item => item._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {filteredItems.map((item) => (
                                <SortableItem
                                    key={item._id}
                                    id={item._id}
                                    item={item}
                                    onDeprioritize={handleDeprioritize}
                                    onMarkWatched={handleMarkWatched}
                                    availableTags={tags} // Pass global tags
                                    onItemUpdate={handleItemUpdate}
                                    isDragEnabled={true}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

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
