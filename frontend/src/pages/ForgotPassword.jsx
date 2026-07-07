import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, Key, ArrowLeft, Copy, Check } from 'lucide-react';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [receivedOtp, setReceivedOtp] = useState('');
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.success) {
                setOtpSent(true);
                // Backend returns OTP in data.otp for testing convenience
                setReceivedOtp(response.data.data?.otp || '');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please check email address.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(receivedOtp);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <div className="auth-header">
                    <Key className="brand-icon" size={32} style={{ color: 'var(--accent-warning)' }} />
                    <h1>Reset Password</h1>
                    <p>Request a secure verification code to recover your account</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {!otpSent ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
                            {isLoading ? 'Sending Request...' : 'Send Verification Code'}
                        </button>
                    </form>
                ) : (
                    <div className="otp-verification-screen">
                        <div className="auth-success" style={{ marginBottom: '1.5rem' }}>
                            Verification code successfully generated!
                        </div>

                        {receivedOtp && (
                            <div className="otp-display-box glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed var(--accent-warning)' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)' }}>YOUR ONE-TIME PASSWORD (OTP)</span>
                                    <strong style={{ fontSize: '1.5rem', color: 'var(--accent-warning)', letterSpacing: '2px' }}>{receivedOtp}</strong>
                                </div>
                                <button onClick={handleCopy} className="btn-page" style={{ padding: '0.5rem' }}>
                                    {copied ? <Check size={18} color="var(--accent-success)" /> : <Copy size={18} />}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/reset-password', { state: { email } })}
                            className="btn-primary auth-submit"
                            style={{ background: 'var(--accent-warning)', color: '#000', fontWeight: 'bold' }}
                        >
                            Proceed to Reset Password
                        </button>
                    </div>
                )}

                <div className="auth-footer">
                    <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                        <ArrowLeft size={16} /> Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
