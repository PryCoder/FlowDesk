import supabase from '../utils/supabaseClient.js';
import crypto from 'crypto';

export class CanvasModel {
  // Generate unique room code
  static generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Generate invitation token
  static generateInvitationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create a new canvas room (Admin only)
  static async createRoom(roomData) {
    const {
      company_id,
      created_by,
      created_by_role,
      title,
      description,
      settings = {},
      is_public = false
    } = roomData;

    // Generate unique room code
    let roomCode;
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = this.generateRoomCode();
      const { data: existing } = await supabase
        .from('canvas_rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single();
      
      if (!existing) isUnique = true;
    }

    const roomPayload = {
      company_id,
      created_by,
      created_by_role,
      title,
      description,
      room_code: roomCode,
      is_public,
      is_active: true,
      settings: {
        allowDrawing: true,
        allowShapes: true,
        allowText: true,
        allowStickyNotes: true,
        maxUsers: 50,
        readOnly: false,
        ...settings
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    const { data: room, error } = await supabase
      .from('canvas_rooms')
      .insert(roomPayload)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - createRoom: ${error.message}`);

    // Add creator as participant with moderator permissions
    await this.addParticipant({
      room_id: room.id,
      user_id: created_by,
      user_role: created_by_role,
      user_name: roomData.creator_name || '',
      user_email: roomData.creator_email || '',
      permissions: {
        canDraw: true,
        canEdit: true,
        canInvite: true,
        isModerator: true
      }
    });

    return room;
  }

  // Get room by code
  static async getRoomByCode(roomCode) {
    const { data, error } = await supabase
      .from('canvas_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`CanvasModel - getRoomByCode: ${error.message}`);
    return data;
  }

  // Get room by ID
  static async getRoomById(roomId) {
    const { data, error } = await supabase
      .from('canvas_rooms')
      .select(`
        *,
        canvas_participants (*)
      `)
      .eq('id', roomId)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`CanvasModel - getRoomById: ${error.message}`);
    return data;
  }

  // Get company rooms
  static async getCompanyRooms(companyId, options = {}) {
    const { page = 1, limit = 20, active = true } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('canvas_rooms')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (active !== undefined) {
      query = query.eq('is_active', active);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`CanvasModel - getCompanyRooms: ${error.message}`);

    return {
      rooms: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Update room settings
  static async updateRoom(roomId, updateData) {
    const { data, error } = await supabase
      .from('canvas_rooms')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - updateRoom: ${error.message}`);
    return data;
  }

  // Close/archive room
  static async closeRoom(roomId) {
    const { data, error } = await supabase
      .from('canvas_rooms')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - closeRoom: ${error.message}`);
    return data;
  }

  // Add participant to room
  static async addParticipant(participantData) {
    const { data, error } = await supabase
      .from('canvas_participants')
      .insert({
        ...participantData,
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - addParticipant: ${error.message}`);
    return data;
  }

  // Update participant activity
  static async updateParticipantActivity(participantId) {
    const { data, error } = await supabase
      .from('canvas_participants')
      .update({
        last_active: new Date().toISOString()
      })
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - updateParticipantActivity: ${error.message}`);
    return data;
  }

  // Get room participants
  static async getRoomParticipants(roomId) {
    const { data, error } = await supabase
      .from('canvas_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) throw new Error(`CanvasModel - getRoomParticipants: ${error.message}`);
    return data;
  }

  // Remove participant from room
  static async removeParticipant(roomId, userId) {
    const { data, error } = await supabase
      .from('canvas_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - removeParticipant: ${error.message}`);
    return data;
  }

  // Create invitation
  static async createInvitation(invitationData) {
    const token = this.generateInvitationToken();
    
    const { data, error } = await supabase
      .from('canvas_invitations')
      .insert({
        ...invitationData,
        invitation_token: token,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - createInvitation: ${error.message}`);
    return data;
  }

  // Get invitation by token
  static async getInvitationByToken(token) {
    const { data, error } = await supabase
      .from('canvas_invitations')
      .select(`
        *,
        canvas_rooms (*)
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) throw new Error(`CanvasModel - getInvitationByToken: ${error.message}`);
    return data;
  }

  // Update invitation status
  static async updateInvitationStatus(invitationId, status) {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'accepted') {
      updateData.accepted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('canvas_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - updateInvitationStatus: ${error.message}`);
    return data;
  }

  // Get room invitations
  static async getRoomInvitations(roomId) {
    const { data, error } = await supabase
      .from('canvas_invitations')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`CanvasModel - getRoomInvitations: ${error.message}`);
    return data;
  }

  // Save canvas snapshot
  static async saveSnapshot(snapshotData) {
    const { data, error } = await supabase
      .from('canvas_snapshots')
      .insert(snapshotData)
      .select()
      .single();

    if (error) throw new Error(`CanvasModel - saveSnapshot: ${error.message}`);
    return data;
  }

  // Get room snapshots
  static async getRoomSnapshots(roomId, limit = 10) {
    const { data, error } = await supabase
      .from('canvas_snapshots')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`CanvasModel - getRoomSnapshots: ${error.message}`);
    return data;
  }

  // Get user's canvas rooms
  static async getUserRooms(userId, userRole) {
    const { data, error } = await supabase
      .from('canvas_participants')
      .select(`
        canvas_rooms (*)
      `)
      .eq('user_id', userId)
      .eq('user_role', userRole)
      .order('joined_at', { ascending: false });

    if (error) throw new Error(`CanvasModel - getUserRooms: ${error.message}`);
    
    return data.map(item => item.canvas_rooms).filter(Boolean);
  }

  // Check if user can join room
  static async canUserJoinRoom(roomId, userId, userRole) {
    // Check if room exists and is active
    const { data: room, error: roomError } = await supabase
      .from('canvas_rooms')
      .select('id, is_active, is_public, company_id, settings')
      .eq('id', roomId)
      .single();

    if (roomError || !room || !room.is_active) {
      return { canJoin: false, reason: 'Room not found or inactive' };
    }

    // Check if user is already a participant
    const { data: participant } = await supabase
      .from('canvas_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (participant) {
      return { canJoin: true, isParticipant: true, participantId: participant.id };
    }

    // Check if room is public
    if (room.is_public) {
      return { canJoin: true, isPublic: true };
    }

    // Check for valid invitation
    const { data: invitation } = await supabase
      .from('canvas_invitations')
      .select('id, permissions')
      .eq('room_id', roomId)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitation) {
      return { canJoin: true, hasInvitation: true, invitationId: invitation.id, permissions: invitation.permissions };
    }

    return { canJoin: false, reason: 'No access to this private room' };
  }
}

export default CanvasModel;