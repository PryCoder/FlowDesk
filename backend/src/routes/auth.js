import express from 'express';
import authService from '../services/authService.js';

const router = express.Router();

// Enhanced authentication middleware with detailed debugging
const authenticate = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n=== AUTHENTICATE MIDDLEWARE [${requestId}] ===`);
    console.log(`📍 Route: ${req.method} ${req.path}`);
    console.log(`🕒 Time: ${new Date().toISOString()}`);
    
    const authHeader = req.headers.authorization;
    console.log(`📨 Auth Header: ${authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING'}`);
    
    const token = authHeader?.split(' ')[1];
    console.log(`🔐 Token: ${token ? token.substring(0, 50) + '...' : 'NO TOKEN'}`);
    
    if (!token) {
      console.log(`❌ [${requestId}] No token provided`);
      return res.status(401).json({ 
        success: false,
        error: 'No token provided',
        requestId 
      });
    }
    
    console.log(`🔍 [${requestId}] Verifying token with authService...`);
    const decoded = await authService.verifyToken(token);
    
    console.log(`✅ [${requestId}] Authentication SUCCESS:`, {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      responseTime: `${Date.now() - startTime}ms`
    });
    
    req.user = decoded;
    next();
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] Authentication FAILED:`, {
      error: error.message,
      name: error.name,
      responseTime: `${responseTime}ms`,
      route: `${req.method} ${req.path}`
    });
    
    res.status(401).json({ 
      success: false,
      error: error.message,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
};

// Enhanced verify-token endpoint
router.get('/verify-token', authenticate, async (req, res) => {
  try {
    console.log('✅ Verify-token endpoint - Token is valid');
    res.json({
      success: true,
      valid: true,
      user: req.user,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Verify-token endpoint error:', error);
    res.status(401).json({ 
      success: false, 
      valid: false, 
      error: error.message 
    });
  }
});

// Enhanced verify endpoint
router.get('/verify', authenticate, async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🔐 [${requestId}] VERIFY ENDPOINT CALLED`);
    console.log(`📋 [${requestId}] Request Details:`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Validate user object from authentication middleware
    if (!req.user) {
      console.log(`❌ [${requestId}] No user object in request`);
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Authentication failed - no user data',
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    }

    const { userId, email, role, companyId } = req.user;

    console.log(`👤 [${requestId}] User from token:`, {
      userId,
      email,
      role,
      companyId,
      hasFirstName: !!req.user.firstName,
      hasLastName: !!req.user.lastName
    });

    // Validate required user fields
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!email) missingFields.push('email');
    if (!role) missingFields.push('role');

    if (missingFields.length > 0) {
      console.log(`❌ [${requestId}] Missing user fields:`, missingFields);
      return res.status(401).json({
        success: false,
        valid: false,
        error: `Incomplete user data: missing ${missingFields.join(', ')}`,
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    }

    const responseTime = Date.now() - startTime;

    console.log(`✅ [${requestId}] VERIFICATION SUCCESSFUL`, {
      userId,
      email,
      role,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    // Successful response
    res.json({
      success: true,
      valid: true,
      user: {
        id: userId,
        email: email,
        role: role,
        companyId: companyId,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      },
      session: {
        issuedAt: new Date().toISOString(),
        expiresIn: '24h',
        role: role
      },
      metadata: {
        requestId: requestId,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error(`💥 [${requestId}] VERIFICATION FAILED:`, {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    res.status(401).json({
      success: false,
      valid: false,
      error: error.message,
      metadata: {
        requestId: requestId,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Enhanced login endpoints with debugging
router.post('/admin/login', async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🔑 [${requestId}] ADMIN LOGIN ATTEMPT`);
    console.log(`📧 Email: ${req.body.email}`);
    console.log(`🕒 Time: ${new Date().toISOString()}`);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log(`❌ [${requestId}] Missing email or password`);
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    console.log(`🔍 [${requestId}] Calling authService.loginAdmin...`);
    const result = await authService.loginAdmin(email, password);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] ADMIN LOGIN SUCCESS:`, {
      email: result.admin.email,
      userId: result.admin.id,
      responseTime: `${responseTime}ms`,
      tokenPreview: result.token ? `${result.token.substring(0, 50)}...` : 'NO TOKEN'
    });
    
    res.json({
      success: true,
      message: 'Admin login successful',
      ...result
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] ADMIN LOGIN FAILED:`, {
      error: error.message,
      responseTime: `${responseTime}ms`,
      email: req.body.email
    });
    
    res.status(401).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.post('/employee/login', async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n👤 [${requestId}] EMPLOYEE LOGIN ATTEMPT`);
    console.log(`📧 Email: ${req.body.email}`);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    const result = await authService.loginEmployee(email, password);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] EMPLOYEE LOGIN SUCCESS:`, {
      email: result.employee.email,
      responseTime: `${responseTime}ms`
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      ...result
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] EMPLOYEE LOGIN FAILED:`, {
      error: error.message,
      responseTime: `${responseTime}ms`
    });
    
    res.status(401).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Company Registration
router.post('/company/register', async (req, res) => {
  try {
    console.log('🏢 COMPANY REGISTRATION ATTEMPT');
    const { companyData, adminData } = req.body;
    
    const company = await authService.createCompany(companyData);
    const admin = await authService.createAdmin(adminData, company.id);
    
    console.log('✅ COMPANY REGISTERED SUCCESSFULLY:', company.name);
    
    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      company,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name
      }
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Generate OTP for employee registration
router.post('/otp/generate', authenticate, async (req, res) => {
  try {
    const { companyId } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can generate OTPs' });
    }
    
    const otp = await authService.generateOTP(companyId, req.user.userId);
    
    res.json({
      success: true,
      message: 'OTP generated successfully',
      otp: otp.otp_code,
      expiresAt: otp.expires_at
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Validate OTP and register employee
router.post('/employee/register', async (req, res) => {
  try {
    const { companyId, otpCode, employeeData } = req.body;

    // Validate OTP
    await authService.validateOTP(companyId, otpCode);

    // Map fields to match DB column names
    const newEmployee = {
      company_id: companyId,
      email: employeeData.email,
      password: employeeData.password,
      first_name: employeeData.firstName || employeeData.first_name,
      last_name: employeeData.lastName || employeeData.last_name,
      role: employeeData.role || 'employee',
      department: employeeData.department || null,
      position: employeeData.position || null,
      hire_date: employeeData.hireDate || new Date().toISOString().split('T')[0]
    };

    const employee = await authService.createEmployee(newEmployee);

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.first_name,
        lastName: employee.last_name,
        role: employee.role,
        department: employee.department,
        position: employee.position,
        hireDate: employee.hire_date
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Public: Get All Companies
router.get('/company/all', async (req, res) => {
  try {
    const companies = await authService.getAllCompanies();
    res.json({
      success: true,
      companies
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change Password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    await authService.changePassword(
      req.user.userId, 
      currentPassword, 
      newPassword, 
      req.user.role
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Reset Password Request
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email, userRole = 'employee' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await authService.resetPassword(email, userRole);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Employee Profile
router.get('/employee/profile', authenticate, async (req, res) => {
  try {
    const profile = await authService.getEmployeeProfile(req.user.userId);
    
    res.json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        department: profile.department,
        position: profile.position,
        hireDate: profile.hire_date,
        lastLogin: profile.last_login,
        company: profile.companies
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update Employee Profile
router.put('/employee/profile', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Only employees can update their profile' });
    }

    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.email;
    delete updateData.company_id;
    delete updateData.password_hash;
    delete updateData.role;
    
    const profile = await authService.updateEmployeeProfile(req.user.userId, updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        department: profile.department,
        position: profile.position
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get Company Employees (Admin only)
router.get('/company/employees', authenticate, async (req, res) => {
  try {
   
    
    const { page = 1, limit = 50 } = req.query;
    const result = await authService.getCompanyEmployees(req.user.companyId, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Current User Profile
router.get('/current-user', authenticate, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.userId, req.user.role);
    
    // Format response based on user role
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      company: user.companies ? {
        id: user.companies.id,
        name: user.companies.name,
        email: user.companies.email,
        industry: user.companies.industry
      } : null
    };

    // Add role-specific fields
    if (user.role === 'employee') {
      userResponse.department = user.department;
      userResponse.position = user.position;
      userResponse.hireDate = user.hire_date;
      userResponse.lastLogin = user.last_login;
    }

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Current user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get Users (Admin only)
router.get('/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access users list' });
    }
    
    const {
      page = 1,
      limit = 50,
      search = '',
      department = '',
      role = '',
      sortBy = 'first_name',
      sortOrder = 'asc'
    } = req.query;

    const result = await authService.getUsers({
      companyId: req.user.companyId,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      department,
      role,
      sortBy,
      sortOrder: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc'
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;