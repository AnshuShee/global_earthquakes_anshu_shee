import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import './Auth.css';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (location.state && location.state.email) {
            setEmail(location.state.email);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword
            });

            if (response.data.success) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed. Please check OTP or credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <div className="auth-header">
                    <ShieldCheck className="brand-icon" size={32} style={{ color: 'var(--accent-success)' }} />
                    <h1>New Password</h1>
                    <p>Please enter your verification OTP and specify a new secure password</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Confirm your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">One-Time Password (OTP)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter received OTP"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? 'Resetting password...' : 'Update Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
