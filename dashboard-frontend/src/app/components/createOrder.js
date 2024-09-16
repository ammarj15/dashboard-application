import { useState } from "react";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const createOrder = async (orderData) => {
    const { data } = await axios.post('http://localhost:3000/api/v1/orders', orderData);
    return data;
}

export default function CreateOrderForm() {
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [items, setItems] = useState([{ product: '', quantity: 1}])

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (data) => {
            //invalidate queries to updates cache
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            //Reset form or show success message etc..
            setCustomerName('');
            setCustomerEmail('');
            setItems([{ product: '', quantity: 1 }]);
            toast.success('Order created successfully!', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            console.log("Order Created!")
        },
        onError: (error) => {
            toast.error('Failed to create order. Please try again.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        mutation.mutate({
            customer: { name: customerName, email: customerEmail },
            items: items.map(item => ({ product: item.product, quantity: parseInt(item.quantity) })),
        })
    }

    const addItem = () => {
        setItems([...items, { product: '', quantity: 1 }])
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-dark-blue text-white p-4 rounded-lg shadow-md">
                <h2 className="text-2xl font bold mb-4"></h2>
                <div className="mb-4">
                    <label htmlFor="customerName" className="block mb-2">Customer Name</label>
                    <input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 opacity-100"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="customerEmail" className="block mb-2">Customer Email</label>
                    <input
                        type="text"
                        id="customerEmail"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 opacity-100"
                    />
                </div>
                {items.map((item, index) => (
                    <div key={index} className="mb-4">
                        <label htmlFor={`product-${index}`} className="block mb-2">Product</label>
                        <input
                            type="text"
                            id={`product-${index}`}
                            value={item.product}
                            onChange={(e) => {
                                const newItems = [...items]
                                newItems[index].product = e.target.value
                                setItems(newItems)
                            }}
                            className="w-full p-2 rounded bg-gray-800 opacity-100"
                        />
                        <label htmlFor={`quantity-${index}`} className="block mb-2">Quantity</label>
                        <input
                            type="number"
                            id={`quantity-${index}`}
                            value={item.quantity}
                            onChange={(e) => {
                                const newItems = [...items]
                                newItems[index].quantity = e.target.value
                                setItems(newItems)
                            }}
                            className="w-full p-2 rounded bg-gray-800 opacity-100"
                        />
                    </div>
                ))}
                <button type="button" onClick={addItem} className="bg-light-blue text-dark-blue px-4 py-2 rounded mg-4">
                    Add Item
                </button>
                <button type="submit" className="bg-light-blue text-dark-blue px-4 py-2 rounded">
                    Create Order
                </button>
            </form>
            <ToastContainer />
        </>
    )
}
