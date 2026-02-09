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
import { fetchItems, addItem, reorderItems, deprioritizeItem, markAsWatched } from '../lib/api';
import { Video } from 'lucide-react';

export default function Queue() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const data = await fetchItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to load items', error);
        } finally {
            setLoading(false);
        }
    };

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
            await loadItems();
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
            <div className="text-center mb-12">
                <div className="inline-block mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-50"></div>
                        <h1 className="relative text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            WatchQueue
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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(item => item._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {items.map((item) => (
                            <SortableItem
                                key={item._id}
                                id={item._id}
                                item={item}
                                onDeprioritize={handleDeprioritize}
                                onMarkWatched={handleMarkWatched}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {items.length === 0 && (
                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-700">
                            <Video className="w-20 h-20 mx-auto mb-6 text-slate-600" />
                            <h3 className="text-2xl font-bold text-slate-300 mb-2">Your queue is empty</h3>
                            <p className="text-slate-500 text-lg">Add your first video to get started!</p>
                        </div>
                    )}
                </SortableContext>
            </DndContext>
        </div>
    );
}
