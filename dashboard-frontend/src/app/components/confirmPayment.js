import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CryptoTransaction from './cryptoTrans.js';

const confirmPayment = async ({ orderId, amount, paymentMethod }) => {
    const { data } = await axios.post(`http://localhost:3000/api/v1/orders/${orderId}/payment`, { amount, paymentMethod });
    return data;
};

export default function ConfirmPaymentForm() {
    const [orderId, setOrderId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isCryptoComplete, setIsCryptoComplete] = useState(false);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: confirmPayment,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['inventory']);
            resetForm();
            toast.success('Payment confirmed!', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            console.log("Payment Confirmed!", data);
        },
        onError: (error) => {
            toast.error('Failed to confirm payment. Please try again.', {
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

    }

    const handleConfirm = (e) => {
        e.preventDefault();

        // Check for crypto completion before proceeding
        if (paymentMethod === 'crypto' && !isCryptoComplete) {
            toast.error('Please wait for the transaction to confirm before confirming payment.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            return;
        }

        // Proceed with payment confirmation
        mutation.mutate({ orderId, amount: parseFloat(amount), paymentMethod });
    };

    const resetForm = () => {
        setOrderId('');
        setAmount('');
        setPaymentMethod('card');
        setIsCryptoComplete(false);
    };

    // Handles the event when the crypto transaction is sent
    const handleCryptoSent = () => {
        toast.info('Crypto transaction sent! Please wait for confirmation.', {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    };

    // Handles the event when the crypto transaction is confirmed
    const handleCryptoConfirmed = () => {
        setIsCryptoComplete(true);
        toast.success('Crypto transaction confirmed!', {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-dark-blue text-white p-2 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4"></h2>
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
                <div className="mb-4">
                    <label htmlFor="amount" className="block mb-2">Amount</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="paymentMethod" className="block mb-2">Payment Method</label>
                    <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800"
                    >
                        <option value="card">Card</option>
                        <option value="crypto">Crypto</option>
                    </select>
                </div>
                {paymentMethod === 'crypto' && (
                    <CryptoTransaction
                        onTransactionSent={handleCryptoSent}
                        onTransactionConfirmed={handleCryptoConfirmed}
                    />
                )}
                <button type="submit" onClick={handleConfirm} className="bg-light-blue text-dark-blue px-4 py-2 rounded">
                    Confirm Payment
                </button>
            </form>
           <ToastContainer />
        </>
    );
}


