import supabase from '../utils/supabaseClient.js';

export class UserModel {
  // Employee Methods
  static async createEmployee(employeeData) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) throw new Error(`UserModel - createEmployee: ${error.message}`);
    return data;
  }

  static async getEmployeeById(id) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`UserModel - getEmployeeById: ${error.message}`);
    return data;
  }

  static async getEmployeeByEmail(email) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        companies (*)
      `)
      .eq('email', email)
      .single();

    if (error) throw new Error(`UserModel - getEmployeeByEmail: ${error.message}`);
    return data;
  }

  static async updateEmployee(id, updateData) {
    const { data, error } = await supabase
      .from('employees')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`UserModel - updateEmployee: ${error.message}`);
    return data;
  }

  static async getEmployeesByCompany(companyId, options = {}) {
    const { page = 1, limit = 50, active = true } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (active !== undefined) {
      query = query.eq('active', active);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`UserModel - getEmployeesByCompany: ${error.message}`);

    return {
      employees: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static async searchEmployees(companyId, searchTerm, options = {}) {
    const { limit = 20 } = options;

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) throw new Error(`UserModel - searchEmployees: ${error.message}`);
    return data;
  }

  // Admin Methods
  static async createAdmin(adminData) {
    const { data, error } = await supabase
      .from('admins')
      .insert(adminData)
      .select()
      .single();

    if (error) throw new Error(`UserModel - createAdmin: ${error.message}`);
    return data;
  }

  static async getAdminById(id) {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`UserModel - getAdminById: ${error.message}`);
    return data;
  }

  static async getAdminByEmail(email) {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        companies (*)
      `)
      .eq('email', email)
      .single();

    if (error) throw new Error(`UserModel - getAdminByEmail: ${error.message}`);
    return data;
  }

  // Company Methods
  static async createCompany(companyData) {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) throw new Error(`UserModel - createCompany: ${error.message}`);
    return data;
  }

  static async getCompanyById(id) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`UserModel - getCompanyById: ${error.message}`);
    return data;
  }

  static async getCompanyByDomain(domain) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error) throw new Error(`UserModel - getCompanyByDomain: ${error.message}`);
    return data;
  }

  static async updateCompany(id, updateData) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`UserModel - updateCompany: ${error.message}`);
    return data;
  }

  // OTP Methods
  static async createOTP(otpData) {
    const { data, error } = await supabase
      .from('otps')
      .insert(otpData)
      .select()
      .single();

    if (error) throw new Error(`UserModel - createOTP: ${error.message}`);
    return data;
  }

  static async getValidOTP(companyId, otpCode) {
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('company_id', companyId)
      .eq('otp_code', otpCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) throw new Error(`UserModel - getValidOTP: ${error.message}`);
    return data;
  }

  static async markOTPAsUsed(otpId) {
    const { data, error } = await supabase
      .from('otps')
      .update({ used: true })
      .eq('id', otpId)
      .select()
      .single();

    if (error) throw new Error(`UserModel - markOTPAsUsed: ${error.message}`);
    return data;
  }

  static async getRecentOTPs(companyId, limit = 10) {
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`UserModel - getRecentOTPs: ${error.message}`);
    return data;
  }

  // Department Methods
  static async getDepartments(companyId) {
    const { data, error } = await supabase
      .from('employees')
      .select('department')
      .eq('company_id', companyId)
      .eq('active', true)
      .not('department', 'is', null);

    if (error) throw new Error(`UserModel - getDepartments: ${error.message}`);

    const departments = [...new Set(data.map(item => item.department))].filter(Boolean);
    return departments;
  }

  static async getEmployeesByDepartment(companyId, department) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .eq('department', department)
      .eq('active', true)
      .order('first_name');

    if (error) throw new Error(`UserModel - getEmployeesByDepartment: ${error.message}`);
    return data;
  }

  // Statistics Methods
  static async getCompanyStats(companyId) {
    const { data: employeeCount, error: employeeError } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('active', true);

    const { data: adminCount, error: adminError } = await supabase
      .from('admins')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId);

    if (employeeError || adminError) {
      throw new Error(`UserModel - getCompanyStats: ${employeeError?.message || adminError?.message}`);
    }

    return {
      totalEmployees: employeeCount?.length || 0,
      totalAdmins: adminCount?.length || 0,
      departments: await this.getDepartments(companyId)
    };
  }

  // Activity Methods
  static async updateLastLogin(userId, userType = 'employee') {
    const table = userType === 'admin' ? 'admins' : 'employees';
    
    const { data, error } = await supabase
      .from(table)
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`UserModel - updateLastLogin: ${error.message}`);
    return data;
  }

  static async deactivateEmployee(employeeId) {
    const { data, error } = await supabase
      .from('employees')
      .update({ 
        active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) throw new Error(`UserModel - deactivateEmployee: ${error.message}`);
    return data;
  }

  static async reactivateEmployee(employeeId) {
    const { data, error } = await supabase
      .from('employees')
      .update({ 
        active: true,
        deactivated_at: null
      })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) throw new Error(`UserModel - reactivateEmployee: ${error.message}`);
    return data;
  }

  // Validation Methods
  static async isEmailUnique(email, userType = 'employee') {
    const table = userType === 'admin' ? 'admins' : 'employees';
    
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .single();

    // If no error and data exists, email is not unique
    return !(data && !error);
  }

  static async validateCompanyDomain(domain) {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('domain', domain)
      .single();

    // If no error and data exists, domain is taken
    return !(data && !error);
  }
}

export default UserModel;