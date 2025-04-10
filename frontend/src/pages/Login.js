import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Background3D from '../components/Background3D';
import { Link } from 'react-router-dom';

const LoginContainer = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    position: relative;
    overflow: hidden;
`;

const LoginCard = styled(motion.div)`
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    border: 1px solid rgba(255, 255, 255, 0.18);
    z-index: 1;
`;

const Title = styled(motion.h1)`
    color: #fff;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const Input = styled(motion.input)`
    width: 100%;
    padding: 1rem;
    margin-bottom: 1rem;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 1rem;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.5);
    }

    &::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
`;

const Button = styled(motion.button)`
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
    }

    &:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
`;

const ErrorMessage = styled(motion.div)`
    color: #ff6b6b;
    text-align: center;
    margin-top: 1rem;
    font-size: 0.9rem;
`;

const LinkText = styled(Link)`
    color: #fff;
    text-align: center;
    display: block;
    margin-top: 1rem;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
        color: rgba(255, 255, 255, 0.7);
    }
`;

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginUser(formData);
            localStorage.setItem('token', response.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginContainer>
            <Background3D />
            <LoginCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Title
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Welcome Back
                </Title>
                <form onSubmit={handleSubmit}>
                    <Input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    />
                    <Input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    />
                    <Button
                        type="submit"
                        disabled={loading}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                    {error && (
                        <ErrorMessage
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {error}
                        </ErrorMessage>
                    )}
                    <LinkText to="/register">Don't have an account? Register</LinkText>
                </form>
            </LoginCard>
        </LoginContainer>
    );
};

export default Login;


