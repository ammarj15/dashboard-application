
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';

// Fetch inventory based on filters
const fetchInventory = async (query) => {
    const params = { ...query };
    if (query.available === '') {
        delete params.available;
    }
    const { data } = await axios.get('http://localhost:3000/api/v1/inventory', { params });
    return data;
};

export default function InventoryList( { inventory }) {
    // Input fields state (this updates as user types)
    const [filters, setFilters] = useState({
        name: '',
        category: '',
        available: ''
    });

    // Query state (this only updates when "Apply Filters" is clicked)
    const [query, setQuery] = useState({
        name: '',
        category: '',
        available: ''
    });

    const queryClient = useQueryClient();

    // Fetch data based on the query parameters
    const { data, isLoading, error } = useQuery({
        queryKey: ['inventory', query],
        queryFn: () => fetchInventory(filters),
        keepPreviousData: true
    });

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:3000/api/v1/sse/inventory');

        eventSource.onmessage = (event) => {
            const sseData = JSON.parse(event.data);
            queryClient.setQueryData(['inventory'], (oldData) => {
                if(!oldData) return sseData;
                return {
                    ...oldData,
                    items: sseData.items,
                    //message: console.log("inventory sse hit!")
                };
            });
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [queryClient, filters]);

    // Handle filter input changes
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // Handle form submission and update query state
    const handleSearch = (e) => {
        e.preventDefault();
        setQuery(filters); // This will trigger the fetch with current filter inputs
    };

    // Clear filters and reset input fields
    const handleClearFilters = () => {
        setFilters({
            name: '',
            category: '',
            available: ''
        });
        setQuery({
            name: '',
            category: '',
            available: ''
        });
    };

    if (isLoading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-white">An error occurred: {error.message}</div>;

    return (
        <div className="bg-gray-900 text-white p-4 rounded-lg ">
            <h2 className="text-2xl font-bold mb-4"></h2>
            
            <form onSubmit={handleSearch} className="mb-4">
                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        name="name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        placeholder="Search by name..."
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white flex-grow"
                    />
                    <select
                        name="category"
                        onChange={handleFilterChange}
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white"
                    >
                        <option value="">All Categories</option>
                        <option value="Sports">Sports</option>
                        <option value="Instruments">Instruments</option>
                        <option value="Electronics">Electronics</option>
                    </select>
                    <select
                        name="available"
                        value={filters.available}
                        onChange={handleFilterChange}
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white"
                    >
                        <option value="">All</option>
                        <option value="true">Available</option>
                        <option value="false">Not Available</option>
                    </select>
                    <button type="submit" className="bg-light-blue p-2 rounded text-white">
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="p-2 rounded text-light-blue"
                    >
                        Clear Filters
                    </button>
                </div>
            </form>

            <ul className="space-y-4">
                {data?.map((item) => (
                    <li key={item.id} className="bg-gray-400 bg-opacity-10 p-4 rounded-xl">
                        <h2 className='font-bold'>Product ID: {item.id}</h2>
                        <p>Product: {item.name}</p>
                        <p>Category: {item.category}</p>
                        <p>Available: {item.availability ? 'Yes' : 'No'}</p>
                        <p>Remaining Stock: {item.quantity}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}