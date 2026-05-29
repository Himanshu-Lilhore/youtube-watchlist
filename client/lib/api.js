import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/items';

axios.defaults.withCredentials = true;

export const fetchItems = async (status = 'active') => {
    const response = await axios.get(API_URL, { params: { status } });
    return response.data;
};

// Paginated fetch. Returns { items, total, page, limit, totalPages }.
export const fetchItemsPaginated = async (page = 1, limit = 10) => {
    const response = await axios.get(API_URL, { params: { page, limit } });
    return response.data;
};

export const addItem = async (url, tags) => {
    const response = await axios.post(API_URL, { url, tags });
    return response.data;
};

export const reorderItems = async (items) => {
    const response = await axios.put(`${API_URL}/reorder`, { items });
    return response.data;
};

export const deprioritizeItem = async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/deprioritize`);
    return response.data;
};

export const markAsWatched = async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status: 'watched' });
    return response.data;
};

export const restoreItem = async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status: 'active' });
    return response.data;
};

export const updateItemTags = async (id, tags) => {
    const response = await axios.patch(`${API_URL}/${id}/tags`, { tags });
    return response.data;
};

// Tag Management APIs
const TAGS_API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/tags';

export const fetchTags = async () => {
    const response = await axios.get(TAGS_API_URL);
    return response.data;
};

export const createTag = async (name) => {
    const response = await axios.post(TAGS_API_URL, { name });
    return response.data;
};

export const deleteTag = async (id) => {
    const response = await axios.delete(`${TAGS_API_URL}/${id}`);
    return response.data;
};

export const updateTag = async (id, name) => {
    const response = await axios.patch(`${TAGS_API_URL}/${id}`, { name });
    return response.data;
};

// Preferences APIs
const PREFS_API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/preferences';

export const fetchPreferences = async () => {
    const response = await axios.get(PREFS_API_URL);
    return response.data; // { filters, sortOrder, updatedAt }
};

export const savePreferences = async ({ filters, sortOrder }) => {
    const response = await axios.put(PREFS_API_URL, { filters, sortOrder });
    return response.data;
};
