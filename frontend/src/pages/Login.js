import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!credentials.username || !credentials.password) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        // Simulate authentication API call
        setTimeout(() => {
            if (credentials.username === 'admin' && credentials.password === 'admin') {
                localStorage.setItem('token', 'demo-token-123');
                navigate('/dashboard'); // Navigate to dashboard on success
            } else {
                setError('Invalid username or password');
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="galaxy-container">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Login</h1>
                        <p>Please enter your credentials</p>
                    </div>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                placeholder="Username"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="Password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        {error && <p className="error-message">{error}</p>}
                    </form>
                    <div className="login-footer">
                        <p>Need help? Contact support.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;


