import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const login = async (credentials) => {
    const { data } = await axios.post('http://localhost:3000/api/v1/auth/login', credentials);
    return data;
};

export default function LoginForm({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const mutation = useMutation({
        mutationFn: login,
        onSuccess: (data) => {
            onLoginSuccess(console.log(data.token));
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ email, password });
    };

    return (
        <form onSubmit={handleSubmit} className='bg-dark-blue color-white p-4 rounded-lg shadow-md'>
            <h2 className='text-2xl font-bold mb-4'>Login</h2>
            <div className='mb-4'>
                <label htmlFor='email' className='block mb-2 text-white'>Email</label>
                <input
                    type='email'
                    id='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full p-2 rounded bg-gray-800 bg opacity-100 text-white'
                />
            </div>
            <div className='mb-4'>
                <label htmlFor='password' className='block mb-2'>Password</label>
                <input
                    type='password'
                    id='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full p-2 rounded bg-gray-800'
                />
            </div>
            <button type='submit' className='bg-light-blue text-dark-blue px-4 py-2 rounded'>
                Login
            </button>
        </form>
    )
}

