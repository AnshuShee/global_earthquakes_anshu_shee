import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Key, Mail, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import './Profile.css';

const Profile = () => {
    const { user, token } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [updateError, setUpdateError] = useState('');

    // Password change states
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Email verification states
    const [verificationOtp, setVerificationOtp] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [receivedOtp, setReceivedOtp] = useState('');
    const [verifyMessage, setVerifyMessage] = useState('');
    const [verifyError, setVerifyError] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setProfileData(res.data.data);
            setName(res.data.data.name);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setUpdateMessage('');
        setUpdateError('');

        try {
            const res = await api.patch('/auth/profile', { name });
            if (res.data.success) {
                setProfileData(res.data.data);
                setUpdateMessage('Profile details successfully updated.');
            }
        } catch (err) {
            setUpdateError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setIsChangingPassword(true);
        setPasswordMessage('');
        setPasswordError('');

        try {
            const res = await api.post('/auth/change-password', { oldPassword, newPassword });
            if (res.data.success) {
                setPasswordMessage('Password changed successfully.');
                setOldPassword('');
                setNewPassword('');
            }
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        setVerifyMessage('');
        setVerifyError('');

        try {
            const res = await api.post('/auth/send-otp');
            if (res.data.success) {
                setVerifyMessage('A verification OTP has been triggered below.');
                setReceivedOtp(res.data.data?.otp || '');
            }
        } catch (err) {
            setVerifyError(err.response?.data?.message || 'Failed to trigger verification OTP.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setVerifyMessage('');
        setVerifyError('');

        try {
            const res = await api.post('/auth/verify-email', { otp: verificationOtp });
            if (res.data.success) {
                setVerifyMessage('Email verification successful!');
                setVerificationOtp('');
                setReceivedOtp('');
                fetchProfile(); // Reload profile flags
            }
        } catch (err) {
            setVerifyError(err.response?.data?.message || 'Verification failed. Invalid OTP code.');
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Loading user profile...</div>;
    }

    return (
        <div className="profile-page">
            <header className="page-header">
                <h1>User Account Settings</h1>
                <p className="text-muted">Manage your security profiles, credential settings, and metadata details.</p>
            </header>

            <div className="profile-grid">
                {/* Profile Card Info */}
                <div className="profile-card glass-panel info-panel">
                    <div className="avatar-large">
                        {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2>{profileData?.name}</h2>
                    <span className="badge-role">{profileData?.role}</span>

                    <div className="profile-meta-list">
                        <div className="meta-item">
                            <Mail size={16} />
                            <span>{profileData?.email}</span>
                        </div>
                        <div className="meta-item">
                            {profileData?.isEmailVerified ? (
                                <span className="verified-status success">
                                    <CheckCircle size={16} /> Verified Account
                                </span>
                            ) : (
                                <span className="verified-status warn">
                                    <ShieldAlert size={16} /> Unverified Account
                                </span>
                            )}
                        </div>
                        <div className="meta-item timestamp">
                            Registered: {new Date(profileData?.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {!profileData?.isEmailVerified && (
                        <div className="email-verification-section glass-panel">
                            <h3>Verify Your Email</h3>
                            <p>Trigger a mock OTP to verify this registered email.</p>

                            {verifyMessage && <div className="profile-success">{verifyMessage}</div>}
                            {verifyError && <div className="profile-error">{verifyError}</div>}

                            {receivedOtp && (
                                <div className="simulation-otp-box">
                                    <span>TEST OTP VALUE: </span>
                                    <strong>{receivedOtp}</strong>
                                </div>
                            )}

                            {!receivedOtp ? (
                                <button className="btn-primary" onClick={handleSendOtp} disabled={isSendingOtp}>
                                    {isSendingOtp ? 'Triggering...' : 'Request Verification OTP'}
                                </button>
                            ) : (
                                <form onSubmit={handleVerifyEmail} className="verify-form">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={verificationOtp}
                                        onChange={(e) => setVerificationOtp(e.target.value)}
                                        placeholder="Enter Received OTP"
                                        required
                                    />
                                    <div className="verify-btn-group">
                                        <button type="submit" className="btn-primary" disabled={isVerifying}>
                                            {isVerifying ? 'Verifying...' : 'Verify'}
                                        </button>
                                        <button type="button" className="btn-page" onClick={() => setReceivedOtp('')}>Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Panel Forms */}
                <div className="profile-actions-column">
                    {/* Edit Profile Form */}
                    <div className="profile-form-card glass-panel">
                        <h3>Update Profile Name</h3>
                        {updateMessage && <div className="profile-success">{updateMessage}</div>}
                        {updateError && <div className="profile-error">{updateError}</div>}

                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="input-with-icon">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter updated name"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isUpdating}>
                                {isUpdating ? 'Saving...' : 'Save Profile Details'}
                            </button>
                        </form>
                    </div>

                    {/* Change Password Form */}
                    <div className="profile-form-card glass-panel">
                        <h3>Update Account Credentials</h3>
                        {passwordMessage && <div className="profile-success">{passwordMessage}</div>}
                        {passwordError && <div className="profile-error">{passwordError}</div>}

                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <div className="input-with-icon">
                                    <Key size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="input-with-icon">
                                    <Key size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters required"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isChangingPassword}>
                                {isChangingPassword ? 'Credentials Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
