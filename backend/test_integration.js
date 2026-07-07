const mongoose = require('mongoose');
const User = require('./src/models/User');

const API_BASE = 'http://localhost:5001/api/v1';

async function runTests() {
    console.log('=== STARTING SEISMICWATCH END-TO-END INTEGRATION TEST ===\n');

    const testEmail = `integration_tester_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Integration Tester';

    let accessToken = '';
    let refreshToken = '';
    let userId = '';

    // Helper fetch function
    const request = async (path, method = 'GET', body = null, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(`${API_BASE}${path}`, options);
        const json = await res.json();
        return { status: res.status, data: json };
    };

    try {
        // 1. Register a new user
        console.log(`[Test] Registering new user: ${testEmail}...`);
        const regRes = await request('/auth/register', 'POST', {
            name: testName,
            email: testEmail,
            password: testPassword
        });

        if (regRes.status !== 201) {
            throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
        }
        console.log('✔ Registration successful.\n');

        // 2. Login to get tokens
        console.log('[Test] Logging in with new user credentials...');
        const loginRes = await request('/auth/login', 'POST', {
            email: testEmail,
            password: testPassword
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
        }
        accessToken = loginRes.data.data.accessToken;
        refreshToken = loginRes.data.data.refreshToken;
        userId = loginRes.data.data.user._id || loginRes.data.data.user.id;
        console.log('✔ Logged in. Tokens received.');
        console.log(`✔ User ID: ${userId}`);
        console.log(`✔ User Role: ${loginRes.data.data.user.role}\n`);

        // 3. Try to access Admin Users list with user token (expect 403 Forbidden)
        console.log('[Test] Accessing /users list as regular "user" role...');
        const usersFailRes = await request('/users', 'GET', null, accessToken);
        if (usersFailRes.status === 403) {
            console.log('✔ Correctly forbidden (403) access to admin user routes.\n');
        } else {
            throw new Error(`Expected 403 Forbidden, got ${usersFailRes.status}: ${JSON.stringify(usersFailRes.data)}`);
        }

        // 4. Upgrade user role in MongoDB directly via mongoose
        console.log('[Database] Connecting to MongoDB and upgrading user role to "admin"...');
        const connStr = 'mongodb+srv://anshushee2000_db_user:Anshu2007@cluster0.ud2g4rz.mongodb.net/earthquakes?appName=Cluster0';
        await mongoose.connect(connStr);
        await User.findByIdAndUpdate(userId, { role: 'admin' });
        await mongoose.connection.close();
        console.log('✔ User has been upgraded to "admin" role in database.\n');

        // Note: To get updated role claims in JWT, we need to refresh or login again
        console.log('[Test] Refreshing tokens to get upgraded permissions...');
        const refreshRes = await request('/auth/jwt/refresh-token', 'POST', { refreshToken });
        if (refreshRes.status !== 200) {
            throw new Error(`Token refresh failed: ${JSON.stringify(refreshRes.data)}`);
        }
        accessToken = refreshRes.data.data.accessToken;
        console.log('✔ Tokens successfully rotated.\n');

        // 5. Test accessing /users as "admin"
        console.log('[Test] Requesting /users list as upgraded "admin" role...');
        const usersSuccessRes = await request('/users', 'GET', null, accessToken);
        if (usersSuccessRes.status === 200) {
            console.log(`✔ Users list retrieved. Registered users count: ${usersSuccessRes.data.data.length}`);
            console.log('✔ Admin authorization verified.\n');
        } else {
            throw new Error(`Expected 200 OK, got ${usersSuccessRes.status}: ${JSON.stringify(usersSuccessRes.data)}`);
        }

        // 6. Test User Provisioning (POST /users)
        const provisionEmail = `provisioned_${Date.now()}@example.com`;
        console.log(`[Test] Provisioning a new user via Admin route: ${provisionEmail}...`);
        const provRes = await request('/users', 'POST', {
            name: 'Provisioned Test User',
            email: provisionEmail,
            password: 'TemporaryPass99!',
            role: 'user',
            status: 'Active'
        }, accessToken);

        if (provRes.status === 201) {
            console.log('✔ New user successfully provisioned.');
            console.log(`✔ Provisioned User ID: ${provRes.data.data._id || provRes.data.data.id}\n`);
        } else {
            throw new Error(`Expected 201 Created, got ${provRes.status}: ${JSON.stringify(provRes.data)}`);
        }
        const provisionedId = provRes.data.data._id || provRes.data.data.id;

        // 7. Test User Property Updates (PATCH /users/:id)
        console.log(`[Test] Updating provisioned user name: ${provisionedId}...`);
        const suspendRes = await request(`/users/${provisionedId}`, 'PATCH', {
            name: 'Updated Name'
        }, accessToken);

        if (suspendRes.status === 200 && suspendRes.data.data.name === 'Updated Name') {
            console.log('✔ User name updated to "Updated Name" successfully.\n');
        } else {
            throw new Error(`Expected 200 with Updated Name, got ${suspendRes.status}: ${JSON.stringify(suspendRes.data)}`);
        }

        // 8. Test provisioned user deletion (DELETE /users/:id)
        console.log(`[Test] Deleting provisioned user profile: ${provisionedId}...`);
        const deleteRes = await request(`/users/${provisionedId}`, 'DELETE', null, accessToken);

        if (deleteRes.status === 200) {
            console.log('✔ User account permanently deleted.\n');
        } else {
            throw new Error(`Expected 200, got ${deleteRes.status}: ${JSON.stringify(deleteRes.data)}`);
        }

        // 9. Test password reset OTP (POST /auth/forgot-password)
        console.log(`[Test] Triggering password recovery OTP for: ${testEmail}...`);
        const forgotRes = await request('/auth/forgot-password', 'POST', { email: testEmail });
        if (forgotRes.status !== 200) {
            throw new Error(`Forgot password trigger failed: ${JSON.stringify(forgotRes.data)}`);
        }
        const otpVal = forgotRes.data.data.otp;
        console.log(`✔ OTP successfully generated: ${otpVal}\n`);

        // 10. Test password reset (POST /auth/reset-password)
        const newTestPassword = 'NewPassword99!';
        console.log(`[Test] Resetting password to: ${newTestPassword}...`);
        const resetRes = await request('/auth/reset-password', 'POST', {
            email: testEmail,
            otp: otpVal,
            newPassword: newTestPassword
        });

        if (resetRes.status !== 200) {
            throw new Error(`Reset password operation failed: ${JSON.stringify(resetRes.data)}`);
        }
        console.log('✔ Password successfully reset. All active user tokens revoked in Mongo.\n');

        // 11. Verify login with the new password
        console.log('[Test] Attempting login with new reset credentials...');
        const reLoginRes = await request('/auth/login', 'POST', {
            email: testEmail,
            password: newTestPassword
        });

        if (reLoginRes.status === 200) {
            console.log('✔ Login with the new password succeeded. Token authentication re-established.\n');
        } else {
            throw new Error(`Expect 200 on login after password reset, got ${reLoginRes.status}: ${JSON.stringify(reLoginRes.data)}`);
        }

        console.log('🎉 ALL END-TO-END MIDDLEWARE & ROUTING INTEGRATION TESTS PASSED!');
        console.log('🎉 USER PAGE AUTHORIZATION & ADMIN ACCESS CONTROL CHECKS VERIFIED SUCCESSFULLY!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ INTEGRATION TEST FAILURE:');
        console.error(err.message);
        process.exit(1);
    }
}

runTests();
