import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Đang xác thực email của bạn...');
    const navigate = useNavigate();
    const isVerifying = useRef(false);

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token || !email) {
                setStatus('error');
                setMessage('Mã xác thực hoặc email không hợp lệ.');
                return;
            }

            if (isVerifying.current) return;
            isVerifying.current = true;

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api'}/users/verify-email`, {
                    params: { token, email }
                });
                setStatus('success');
                setMessage(response.data.message || 'Xác thực email thành công!');
                toast.success('Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Có lỗi xảy ra trong quá trình xác thực.');
                toast.error(error.response?.data?.message || 'Xác thực thất bại.');
            }
        };

        verifyEmail();
    }, [token, email]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    {status === 'verifying' && (
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    )}
                    {status === 'success' && (
                        <div className="bg-green-100 text-green-500 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="bg-red-100 text-red-500 rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    {status === 'verifying' && 'Đang xác thực...'}
                    {status === 'success' && 'Xác thực thành công!'}
                    {status === 'error' && 'Xác thực thất bại'}
                </h2>

                <p className="text-gray-600 mb-8">
                    {message}
                </p>

                {status !== 'verifying' && (
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-200"
                    >
                        Quay lại trang Đăng nhập
                    </Link>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
