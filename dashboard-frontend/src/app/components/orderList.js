import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';

const fetchOrders = async (query, page, limit) => {
    const { data } = await axios.get('http://localhost:3000/api/v1/orders', {
        params: { page, limit, ...query }
    });
    return data;
};

export default function OrderList() {
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: '',
        searchTerm: ''
    });
    const [page, setPage] = useState(1);
    const limit = 5;

    const [query, setQuery] = useState({
        searchTerm: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['orders', query, page],
        queryFn: () => fetchOrders(query, page, limit),
        keepPreviousData: true
    });

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:3000/api/v1/sse/orders');

        eventSource.onmessage = (event) => {
            const sseData = JSON.parse(event.data);

            queryClient.setQueryData(['orders', query, page], (oldData) => {
                if (!oldData) return sseData;

                // Merge SSE data with existing data
                return {
                    ...oldData,
                    orders: oldData.orders.map(order => 
                        sseData.orders.find(newOrder => newOrder.id === order.id) || order
                    
                    ),
                    //message: console.log('SSE hit!')
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
    }, [queryClient, page, query]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery(filters);
        setPage(1); // Reset to first page when applying new filters
    };

    const handleClearFilters = () => {
        setFilters({
            searchTerm: '',
            status: '',
            startDate: '',
            endDate: ''
        });
        setQuery({
            searchTerm: '',
            status: '',
            startDate: '',
            endDate: ''
        });
    };

    if (isLoading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-white">An error occurred: {error.message}</div>;

    return (
        <div className="bg-grey-800 text-white p-4 rounded-lg ">
            <h2 className="text-2xl font-bold mb-4"></h2>
            
            <form onSubmit={handleSearch} className="mb-4">
                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                        placeholder="Search..."
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white flex-grow"
                    />
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white"
                    />
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className="bg-light-blue bg-opacity-10 p-2 rounded text-white"
                    />
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

            <div className="space-y-4">
                {data?.orders.map((order) => (
                    <div key={order.id} className="bg-gray-400 bg-opacity-10 p-4 rounded-xl">
                        <h2 className="font-bold">Order ID: {order.id}</h2>
                        <p>Customer: {order.customer.name}</p>
                        <p>Status: {order.status}</p>
                        <p>Created At: {new Date(order.createdAt).toLocaleString()}</p>
                        <h3 className="font-semibold mt-2">Items:</h3>
                        <ul>
                            {order.items.map((item, index) => (
                                <li key={index}>
                                    {item.inventoryItem.name} - Quantity: {item.quantity}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex justify-between items-center">
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="bg-light-blue p-2 rounded text-white disabled:opacity-50"
                >
                    Previous
                </button>
                <span>Page {page} of {data?.totalPages}</span>
                <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={page === data?.totalPages}
                    className="bg-light-blue p-2 rounded text-white disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
