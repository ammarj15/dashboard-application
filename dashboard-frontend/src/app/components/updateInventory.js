import { useState } from 'react';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//think about adding functionality for adding a new item to inventory
const updateInventory = async ({ itemId, quantity }) => {
    const { data } = await axios.put(`http://localhost:3000/api/v1/inventory/${itemId}/update`, { quantity });
    return data;
};

export default function UpdateInventoryForm() {
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    
    const queryClient = useQueryClient();

    const mutation = useMutation({ 
        mutationFn: updateInventory,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['inventory']);
            setItemId('');
            setQuantity('');
            toast.success('Inventory updated successfully!', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            console.log("Inventory updated successfully", data)
        },
        onError: (error) => {
            toast.error('Failed to update inventory. Please try again.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ itemId, quantity: parseInt(quantity) });
    };

    return (
        <>
        <form onSubmit={handleSubmit} className="bg-dark-blue text-white p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Update Inventory</h2>
        <div className="mb-4">
            <label htmlFor="itemId" className="block mb-2">Item ID</label>
            <input
                type="text"
                id="itemId"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full p-2 rounded bg-gray-800"
            />
        </div>
        <div className="mb-4">
            <label htmlFor="quantity" className="block mb-2">New Quantity</label>
            <input
                type="text"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2 rounded bg-gray-800"
            />
        </div>
        <button type="submit" className="bg-light-blue text-dark-blue px-4 py-2 rounded">
                Update Inventory
            </button>
        </form>
        <ToastContainer />
        </>
    );
}