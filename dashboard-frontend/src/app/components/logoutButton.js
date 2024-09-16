import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/')
    };

    return (
        <button
            onClick={handleLogout}
            className='hover:bg-blue-300 text-light-blue font-bold py-2 px-4 rounded'>
                Logout
            </button>
    );
}