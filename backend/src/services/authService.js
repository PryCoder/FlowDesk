import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../utils/supabaseClient.js';
import config from "../../rec/index.js";


export class AuthService {
  constructor() {
    this.saltRounds = 12;
  }

  /* -------------------- COMPANY ADMIN METHODS -------------------- */

  async createCompany(companyData) {
    try {
      const payload = {
        name: companyData.name?.trim(),
        domain: companyData.domain || null,
        industry: companyData.industry || null,
        size: companyData.size || null,
        email: companyData.email || null,
        address: companyData.address || null,
        phone: companyData.phone || null,
        created_at: new Date().toISOString()
      };

      const { data: company, error } = await supabase
        .from('companies')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(`Company creation failed: ${error.message}`);
      return company;
    } catch (error) {
      throw new Error(`Auth Service - createCompany: ${error.message}`);
    }
  }

  async createAdmin(adminData, companyId) {
    try {
      const hashedPassword = await bcrypt.hash(adminData.password, this.saltRounds);

      const payload = {
        company_id: companyId,
        email: adminData.email,
        password_hash: hashedPassword,
        first_name: adminData.first_name || adminData.firstName,
        last_name: adminData.last_name || adminData.lastName,
        role: 'admin',
        created_at: new Date().toISOString()
      };

      const { data: admin, error } = await supabase
        .from('admins')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(`Admin creation failed: ${error.message}`);
      return admin;
    } catch (error) {
      throw new Error(`Auth Service - createAdmin: ${error.message}`);
    }
  }

  async generateOTP(companyId, adminId) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const { data, error } = await supabase
        .from('otps')
        .insert({
          company_id: companyId,
          admin_id: adminId,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();

      if (error) throw new Error(`OTP generation failed: ${error.message}`);

      console.log(`🔐 OTP for company ${companyId}: ${otp}`);
      return data;
    } catch (error) {
      throw new Error(`Auth Service - generateOTP: ${error.message}`);
    }
  }

  async validateOTP(companyId, otpCode) {
    try {
      const { data, error } = await supabase
        .from('otps')
        .select('*')
        .eq('company_id', companyId)
        .eq('otp_code', otpCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) throw new Error('Invalid or expired OTP');

      await supabase.from('otps').update({ used: true }).eq('id', data.id);

      return data;
    } catch (error) {
      throw new Error(`Auth Service - validateOTP: ${error.message}`);
    }
  }

  /* -------------------- EMPLOYEE METHODS -------------------- */

  async createEmployee(employeeData) {
    try {
      const hashedPassword = await bcrypt.hash(employeeData.password, this.saltRounds);

      const payload = {
        company_id: employeeData.company_id,
        email: employeeData.email,
        password_hash: hashedPassword,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        role: employeeData.role || 'employee',
        department: employeeData.department || null,
        position: employeeData.position || null,
        hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(`Employee creation failed: ${error.message}`);
      return data;
    } catch (error) {
      throw new Error(`Auth Service - createEmployee: ${error.message}`);
    }
  }

  async loginEmployee(email, password) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`*, companies (*)`)
        .eq('email', email)
        .single();

      if (error || !data) throw new Error('Employee not found');

      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) throw new Error('Invalid password');

      await supabase
        .from('employees')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      const token = this.generateToken({
        userId: data.id,
        companyId: data.company_id,
        email: data.email,
        role: 'employee',
        firstName: data.first_name,
        lastName: data.last_name
      });

      return {
        token,
        employee: {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
          department: data.department,
          position: data.position,
          company: data.companies
        }
      };
    } catch (error) {
      throw new Error(`Auth Service - loginEmployee: ${error.message}`);
    }
  }

  async loginAdmin(email, password) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select(`*, companies (*)`)
        .eq('email', email)
        .single();

      if (error || !data) throw new Error('Admin not found');

      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) throw new Error('Invalid password');

      const token = this.generateToken({
        userId: data.id,
        companyId: data.company_id,
        email: data.email,
        role: 'admin',
        firstName: data.first_name,
        lastName: data.last_name
      });

      return {
        token,
        admin: {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role,
          company: data.companies
        }
      };
    } catch (error) {
      throw new Error(`Auth Service - loginAdmin: ${error.message}`);
    }
  }

  /* -------------------- USER & COMPANY MANAGEMENT -------------------- */

  async getCurrentUser(userId, role) {
    try {
      const table = role === 'admin' ? 'admins' : 'employees';
      const { data, error } = await supabase
        .from(table)
        .select(`*, companies (*)`)
        .eq('id', userId)
        .single();

      if (error || !data) throw new Error('User not found');
      return data;
    } catch (error) {
      throw new Error(`Auth Service - getCurrentUser: ${error.message}`);
    }
  }

  async getAllCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, industry, size, domain, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(`Auth Service - getAllCompanies: ${error.message}`);
    }
  }

  /* -------------------- ENHANCED EMPLOYEE METHODS FOR MEETINGS -------------------- */

  // Get employees by their IDs (for meeting participants)
  async getEmployeesByIds(employeeIds) {
    try {
      if (!employeeIds || employeeIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          department, 
          position, 
          hire_date, 
          last_login,
          companies (id, name, industry)
        `)
        .in('id', employeeIds)
        .order('first_name', { ascending: true });

      if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
      return data || [];
    } catch (error) {
      console.error('Get employees by IDs error:', error);
      throw new Error('Failed to fetch employees');
    }
  }

  // Enhanced company employees with search and filtering
  async getCompanyEmployees(companyId, page = 1, limit = 50, search = '', department = '') {
    try {
      const from = (page - 1) * limit;
      
      let query = supabase
        .from('employees')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          department, 
          position, 
          hire_date, 
          last_login,
          is_active
        `, { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Apply search filter
      if (search && search.trim() !== '') {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%`);
      }

      // Apply department filter
      if (department && department.trim() !== '') {
        query = query.eq('department', department);
      }

      const { data, error, count } = await query
        .order('first_name', { ascending: true })
        .range(from, from + limit - 1);

      if (error) throw new Error(`Failed to fetch employees: ${error.message}`);

      return {
        employees: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Get company employees error:', error);
      throw new Error('Failed to fetch company employees');
    }
  }

  // Get users with advanced filtering (for admin dashboard)
  async getUsers(options) {
    try {
      const {
        companyId,
        page = 1,
        limit = 50,
        search = '',
        department = '',
        role = '',
        sortBy = 'first_name',
        sortOrder = 'asc'
      } = options;

      const from = (page - 1) * limit;
      
      let query = supabase
        .from('employees')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          department, 
          position, 
          hire_date, 
          last_login,
          is_active,
          companies (id, name)
        `, { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Apply filters
      if (search && search.trim() !== '') {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%`);
      }

      if (department && department.trim() !== '') {
        query = query.eq('department', department);
      }

      if (role && role.trim() !== '') {
        query = query.eq('role', role);
      }

      // Apply sorting
      const validSortColumns = ['first_name', 'last_name', 'email', 'department', 'role', 'hire_date', 'last_login'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'first_name';
      const ascending = sortOrder.toLowerCase() !== 'desc';

      const { data: users, error, count } = await query
        .order(sortColumn, { ascending })
        .range(from, from + limit - 1);

      if (error) throw new Error(`Failed to fetch users: ${error.message}`);

      return {
        users: (users || []).map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          department: user.department,
          position: user.position,
          hireDate: user.hire_date,
          lastLogin: user.last_login,
          isActive: user.is_active,
          company: {
            id: user.company_id,
            name: user.companies?.name
          }
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        filters: { search, department, role }
      };
    } catch (error) {
      console.error('Get users error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Get employee profile with company details
  async getEmployeeProfile(employeeId) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies (*)
        `)
        .eq('id', employeeId)
        .single();

      if (error) throw new Error(`Employee not found: ${error.message}`);
      return data;
    } catch (error) {
      throw new Error(`Auth Service - getEmployeeProfile: ${error.message}`);
    }
  }

  // Update employee profile
  async updateEmployeeProfile(employeeId, updateData) {
    try {
      // Map frontend field names to database column names
      const dbUpdateData = {};
      
      if (updateData.firstName !== undefined) dbUpdateData.first_name = updateData.firstName;
      if (updateData.lastName !== undefined) dbUpdateData.last_name = updateData.lastName;
      if (updateData.department !== undefined) dbUpdateData.department = updateData.department;
      if (updateData.position !== undefined) dbUpdateData.position = updateData.position;
      
      // Also handle direct database field names
      if (updateData.first_name !== undefined) dbUpdateData.first_name = updateData.first_name;
      if (updateData.last_name !== undefined) dbUpdateData.last_name = updateData.last_name;

      const { data, error } = await supabase
        .from('employees')
        .update(dbUpdateData)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw new Error(`Profile update failed: ${error.message}`);
      return data;
    } catch (error) {
      throw new Error(`Auth Service - updateEmployeeProfile: ${error.message}`);
    }
  }

  // Get employees by department (for bulk meeting invitations)
  async getEmployeesByDepartment(companyId, department) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          department, 
          position
        `)
        .eq('company_id', companyId)
        .eq('department', department)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw new Error(`Failed to fetch department employees: ${error.message}`);
      return data || [];
    } catch (error) {
      console.error('Get employees by department error:', error);
      throw new Error('Failed to fetch department employees');
    }
  }

  // Get employees by role (for bulk meeting invitations)
  async getEmployeesByRole(companyId, role) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          department, 
          position
        `)
        .eq('company_id', companyId)
        .eq('role', role)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw new Error(`Failed to fetch role-based employees: ${error.message}`);
      return data || [];
    } catch (error) {
      console.error('Get employees by role error:', error);
      throw new Error('Failed to fetch role-based employees');
    }
  }

  // Search employees across company (for meeting participant selection)
  async searchEmployees(companyId, searchTerm, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          department, 
          position
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('first_name', { ascending: true });

      if (error) throw new Error(`Employee search failed: ${error.message}`);
      return data || [];
    } catch (error) {
      console.error('Search employees error:', error);
      throw new Error('Failed to search employees');
    }
  }

  /* -------------------- AUTH & PASSWORD -------------------- */

  generateToken(payload) {
    try {
      console.log('🔑 GENERATING TOKEN:');
      console.log('   - JWT Secret from config:', config.jwt.secret ? `SET (${config.jwt.secret.length} chars)` : 'NOT SET');
      console.log('   - JWT Secret from env:', process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT SET');
      
      // Use the SAME secret consistently
      const jwtSecret = process.env.JWT_SECRET || config.jwt.secret;
      
      if (!jwtSecret) {
        throw new Error('JWT secret not configured');
      }
      
      console.log('   - Using JWT Secret length:', jwtSecret.length);
      console.log('   - Token payload:', payload);
      
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
      
      console.log('✅ Token generated successfully');
      console.log('   - Token preview:', token.substring(0, 50) + '...');
      
      return token;
    } catch (error) {
      console.error('❌ Token generation failed:', error.message);
      throw error;
    }
  }
  

 // In your authService.js - update the verifyToken method
// In your authService.js - replace the verifyToken method with this:
async verifyToken(token) {
  try {
    console.log('\n=== VERIFY TOKEN - START ===');
    console.log('🔐 Token received:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
    
    // Check if JWT secret is available
    if (!process.env.JWT_SECRET && !config.jwt.secret) {
      throw new Error('JWT secret not configured');
    }
    
    const jwtSecret = process.env.JWT_SECRET || config.jwt.secret;
    console.log('🔑 JWT Secret available:', !!jwtSecret);
    console.log('🔑 JWT Secret length:', jwtSecret?.length);

    // Verify JWT token
    console.log('🔄 Verifying JWT token...');
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ JWT Verified successfully');
    
    console.log('📄 Decoded token payload:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
      exp: new Date(decoded.exp * 1000)
    });

    // Enhanced database query with comprehensive debugging
    let user = null;
    let queryError = null;

    // Method 1: Try based on role
    if (decoded.role === 'admin') {
      console.log(`🔍 Searching for ADMIN with ID: ${decoded.userId}`);
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (adminError) {
        console.log('❌ Admin query error:', adminError);
        queryError = adminError;
      } else {
        user = admin;
        console.log('✅ Admin found:', {
          id: user?.id,
          email: user?.email,
          companyId: user?.company_id
        });
      }
    } else {
      console.log(`🔍 Searching for EMPLOYEE with ID: ${decoded.userId}`);
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (employeeError) {
        console.log('❌ Employee query error:', employeeError);
        queryError = employeeError;
      } else {
        user = employee;
        console.log('✅ Employee found:', {
          id: user?.id,
          email: user?.email,
          companyId: user?.company_id
        });
      }
    }

    // Method 2: If not found by ID, try by email
    if (!user) {
      console.log('🔄 Trying email search as fallback...');
      if (decoded.role === 'admin') {
        const { data: adminByEmail, error: emailError } = await supabase
          .from('admins')
          .select('*')
          .eq('email', decoded.email)
          .single();
        
        if (!emailError && adminByEmail) {
          user = adminByEmail;
          console.log('✅ Admin found by email:', user.email);
        }
      } else {
        const { data: employeeByEmail, error: emailError } = await supabase
          .from('employees')
          .select('*')
          .eq('email', decoded.email)
          .single();
        
        if (!emailError && employeeByEmail) {
          user = employeeByEmail;
          console.log('✅ Employee found by email:', user.email);
        }
      }
    }

    // Method 3: Debug - list all users to see what's available
    if (!user) {
      console.log('❌ USER NOT FOUND - Running comprehensive debug...');
      
      // Get all admins and employees for debugging
      const { data: allAdmins } = await supabase
        .from('admins')
        .select('id, email, first_name, last_name, company_id')
        .limit(10);
      
      const { data: allEmployees } = await supabase
        .from('employees')
        .select('id, email, first_name, last_name, company_id, role')
        .limit(10);
      
      console.log('📊 All admins in database:', allAdmins);
      console.log('📊 All employees in database:', allEmployees);
      
      console.log('🔎 Looking for user with:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId
      });

      // Check if the specific user exists with different queries
      console.log('🔍 Running specific user checks...');
      
      // Check admin table
      const { data: specificAdmin } = await supabase
        .from('admins')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();
      
      // Check employee table  
      const { data: specificEmployee } = await supabase
        .from('employees')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();
      
      console.log('🔍 Specific admin check:', specificAdmin);
      console.log('🔍 Specific employee check:', specificEmployee);

      throw new Error(`User ${decoded.email} (ID: ${decoded.userId}, Role: ${decoded.role}) not found in database. Query error: ${queryError?.message}`);
    }

    console.log('✅ USER VERIFICATION COMPLETE:', {
      id: user.id,
      email: user.email,
      role: decoded.role,
      companyId: user.company_id,
      name: `${user.first_name} ${user.last_name}`
    });

    return {
      userId: user.id,
      email: user.email,
      companyId: user.company_id,
      role: decoded.role,
      firstName: user.first_name,
      lastName: user.last_name
    };

  } catch (error) {
    console.error('❌ VERIFY TOKEN FAILED:', {
      error: error.message,
      name: error.name,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'NO TOKEN',
      timestamp: new Date().toISOString()
    });
    
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token signature - JWT secret mismatch');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired - please login again');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    } else {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

  async changePassword(userId, currentPassword, newPassword, userRole = 'employee') {
    try {
      const table = userRole === 'admin' ? 'admins' : 'employees';

      const { data: user, error } = await supabase
        .from(table)
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !user) throw new Error('User not found');

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) throw new Error('Current password is incorrect');

      const newHash = await bcrypt.hash(newPassword, this.saltRounds);

      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          password_hash: newHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw new Error(`Password update failed: ${updateError.message}`);

      return { success: true };
    } catch (error) {
      throw new Error(`Auth Service - changePassword: ${error.message}`);
    }
  }

  async resetPassword(email, userRole = 'employee') {
    try {
      const table = userRole === 'admin' ? 'admins' : 'employees';

      const { data: user, error } = await supabase
        .from(table)
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !user) throw new Error('User not found');

      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          purpose: 'password_reset',
          role: userRole 
        },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // In a real application, you would send an email here
      console.log(`🔁 Password reset token for ${user.email}: ${resetToken}`);
      console.log(`👤 User: ${user.first_name} ${user.last_name}`);

      return {
        success: true,
        message: 'Password reset instructions sent to email',
        resetToken,
        user: {
          firstName: user.first_name,
          lastName: user.last_name
        }
      };
    } catch (error) {
      throw new Error(`Auth Service - resetPassword: ${error.message}`);
    }
  }

  /* -------------------- UTILITY METHODS -------------------- */

  // Check if employee belongs to company (for meeting validation)
  async validateEmployeeCompany(employeeId, companyId) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, company_id')
        .eq('id', employeeId)
        .eq('company_id', companyId)
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error('Validate employee company error:', error);
      return false;
    }
  }

  // Get company statistics for dashboard
  async getCompanyStats(companyId) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('department, role, is_active')
        .eq('company_id', companyId);

      if (error) throw new Error(`Failed to fetch company stats: ${error.message}`);

      const stats = {
        totalEmployees: data.length,
        activeEmployees: data.filter(emp => emp.is_active).length,
        departments: {},
        roles: {}
      };

      data.forEach(emp => {
        // Department stats
        const dept = emp.department || 'Unassigned';
        stats.departments[dept] = (stats.departments[dept] || 0) + 1;

        // Role stats
        const role = emp.role || 'employee';
        stats.roles[role] = (stats.roles[role] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Get company stats error:', error);
      throw new Error('Failed to fetch company statistics');
    }
  }
}

export default new AuthService();