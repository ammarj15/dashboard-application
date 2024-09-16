import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const refundOrder = async (orderId) => {
    const { data } = await axios.post(`http://localhost:3000/api/v1/orders/${orderId}/refund`);
    return data;
};

export default function RefundOrderForm() {
    const [orderId, setOrderId] = useState('');
    
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: refundOrder,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['inventory']);
            setOrderId('');
            toast.success('Order refunded!', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            console.log("Order refunded", data);
        },
        onError: (error) => {
            toast.error('Failed to refund order. Please try again.', {
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
        mutation.mutate(orderId);
    };

    return (
        <>
        <form onSubmit={handleSubmit} className="bg-dark-blue text-white p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Refund Order</h2>
            <div className="mb-4">
                <label htmlFor="orderId" className="block mb-2">Order ID</label>
                <input
                    type="text"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800"
                />
            </div>
            <button type="submit" className="bg-light-blue text-dark-blue px-4 py-2 rounded">
                Refund Order
            </button>
        </form>
        <ToastContainer />
        </>
    );
}