import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/items';

axios.defaults.withCredentials = true;

export const fetchItems = async () => {
    const response = await axios.get(API_URL);
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
