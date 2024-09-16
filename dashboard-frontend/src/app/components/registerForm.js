'use client'

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const register = async (userData) => {
    const { data } = await axios.post('http://localhost:3000/api/v1/auth/register', userData);
    return data;
};

export default function RegistrationForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: register,
        onSuccess: (data) => {
            setName('');
            setEmail('');
            setPassword('');
            toast.success('Registration successful! You will be redirected.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setTimeout(() => {
                window.location.reload();
            }, 3000);
            console.log("Registration successful:", data);
        },
        onError: (error) => {
            toast.error('Registration failed. Please try again.', {
                position: 'bottom-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            console.error("Registration error:", error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ name, email, password });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-dark-blue text-white p-4 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Register</h2>
                <div className="mb-4">
                    <label htmlFor="name" className="block mb-2">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block mb-2">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block mb-2">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 rounded bg-gray-800"
                    />
                </div>
                <button type="submit" className="bg-light-blue text-dark-blue px-4 py-2 rounded">
                    Register
                </button>
            </form>
            <ToastContainer />
        </>
    );
}