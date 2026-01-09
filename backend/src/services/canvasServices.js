import { CanvasModel } from '../models/canvas.js';
import AuthService from './authService.js';

export class CanvasService {
  // Create new canvas room (Admin only)
  async createRoom(userId, userRole, roomData) {
    try {
      // Verify user is admin
      if (userRole !== 'admin') {
        throw new Error('Only admins can create canvas rooms');
      }

      // Get user details for creator info
      const user = await AuthService.getCurrentUser(userId, userRole);
      
      const roomPayload = {
        ...roomData,
        created_by: userId,
        created_by_role: userRole,
        creator_name: `${user.first_name} ${user.last_name}`,
        creator_email: user.email
      };

      const room = await CanvasModel.createRoom(roomPayload);
      
      return {
        success: true,
        room,
        message: 'Canvas room created successfully',
        joinLink: `/canvas/join/${room.room_code}`
      };
    } catch (error) {
      throw new Error(`CanvasService - createRoom: ${error.message}`);
    }
  }

  // Invite user to canvas room
  async inviteToRoom(roomId, inviterId, inviterRole, invitationData) {
    try {
      // Verify inviter has permission (must be room creator or moderator)
      const room = await CanvasModel.getRoomById(roomId);
      
      if (room.created_by !== inviterId && inviterRole !== 'admin') {
        // Check if inviter is moderator
        const participants = await CanvasModel.getRoomParticipants(roomId);
        const inviterParticipant = participants.find(p => p.user_id === inviterId);
        
        if (!inviterParticipant || !inviterParticipant.permissions?.canInvite) {
          throw new Error('You do not have permission to invite users to this room');
        }
      }

      const invitationPayload = {
        room_id: roomId,
        invited_by: inviterId,
        invited_user_id: invitationData.userId || null,
        invited_email: invitationData.email || null,
        permissions: invitationData.permissions || {
          canDraw: true,
          canEdit: true,
          canInvite: false
        }
      };

      const invitation = await CanvasModel.createInvitation(invitationPayload);

      return {
        success: true,
        invitation,
        message: 'Invitation sent successfully',
        invitationLink: `/canvas/accept/${invitation.invitation_token}`
      };
    } catch (error) {
      throw new Error(`CanvasService - inviteToRoom: ${error.message}`);
    }
  }

  // Accept invitation and join room
  async acceptInvitation(token, userId, userRole, userName, userEmail) {
    try {
      const invitation = await CanvasModel.getInvitationByToken(token);
      
      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Check if invitation is for this user
      if (invitation.invited_user_id && invitation.invited_user_id !== userId) {
        throw new Error('This invitation is for another user');
      }

      if (invitation.invited_email && invitation.invited_email !== userEmail) {
        throw new Error('This invitation is for another email address');
      }

      // Check if user can join room
      const canJoin = await CanvasModel.canUserJoinRoom(
        invitation.room_id,
        userId,
        userRole
      );

      if (!canJoin.canJoin) {
        throw new Error(canJoin.reason || 'Cannot join room');
      }

      // Add user as participant
      const participant = await CanvasModel.addParticipant({
        room_id: invitation.room_id,
        user_id: userId,
        user_role: userRole,
        user_name: userName,
        user_email: userEmail,
        permissions: invitation.permissions
      });

      // Update invitation status
      await CanvasModel.updateInvitationStatus(invitation.id, 'accepted');

      // Get room details
      const room = await CanvasModel.getRoomById(invitation.room_id);

      return {
        success: true,
        room,
        participant,
        message: 'Successfully joined canvas room'
      };
    } catch (error) {
      throw new Error(`CanvasService - acceptInvitation: ${error.message}`);
    }
  }

  // Join room directly (for public rooms or existing participants)
  async joinRoom(roomCode, userId, userRole, userName, userEmail) {
    try {
      const room = await CanvasModel.getRoomByCode(roomCode);
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Check if user can join
      const canJoin = await CanvasModel.canUserJoinRoom(
        room.id,
        userId,
        userRole
      );

      if (!canJoin.canJoin) {
        throw new Error(canJoin.reason || 'Cannot join room');
      }

      // If already participant, just update activity
      if (canJoin.isParticipant) {
        await CanvasModel.updateParticipantActivity(canJoin.participantId);
        return {
          success: true,
          room,
          isReturning: true,
          message: 'Rejoined canvas room'
        };
      }

      // For public rooms or invitations
      let permissions = {
        canDraw: true,
        canEdit: true,
        canInvite: false,
        isModerator: false
      };

      // If joining via invitation, use invitation permissions
      if (canJoin.hasInvitation) {
        permissions = canJoin.permissions;
        
        // Update invitation status
        await CanvasModel.updateInvitationStatus(canJoin.invitationId, 'accepted');
      }

      // Add as new participant
      const participant = await CanvasModel.addParticipant({
        room_id: room.id,
        user_id: userId,
        user_role: userRole,
        user_name: userName,
        user_email: userEmail,
        permissions
      });

      return {
        success: true,
        room,
        participant,
        message: 'Successfully joined canvas room'
      };
    } catch (error) {
      throw new Error(`CanvasService - joinRoom: ${error.message}`);
    }
  }

  // Leave room
  async leaveRoom(roomId, userId) {
    try {
      await CanvasModel.removeParticipant(roomId, userId);
      
      return {
        success: true,
        message: 'Left canvas room successfully'
      };
    } catch (error) {
      throw new Error(`CanvasService - leaveRoom: ${error.message}`);
    }
  }

  // Get room details with participants
  async getRoomDetails(roomId, userId) {
    try {
      const room = await CanvasModel.getRoomById(roomId);
      
      // Check if user is participant
      const participants = await CanvasModel.getRoomParticipants(roomId);
      const isParticipant = participants.some(p => p.user_id === userId);

      if (!room.is_public && !isParticipant) {
        throw new Error('You do not have access to this room');
      }

      return {
        success: true,
        room: {
          ...room,
          participants,
          participantCount: participants.length
        }
      };
    } catch (error) {
      throw new Error(`CanvasService - getRoomDetails: ${error.message}`);
    }
  }

  // Save canvas state
  async saveCanvasSnapshot(roomId, userId, snapshotData) {
    try {
      // Get latest version
      const snapshots = await CanvasModel.getRoomSnapshots(roomId, 1);
      const latestVersion = snapshots.length > 0 ? snapshots[0].version : 0;

      const snapshot = await CanvasModel.saveSnapshot({
        room_id: roomId,
        created_by: userId,
        snapshot_data: snapshotData,
        version: latestVersion + 1
      });

      return {
        success: true,
        snapshot,
        message: 'Canvas state saved successfully'
      };
    } catch (error) {
      throw new Error(`CanvasService - saveCanvasSnapshot: ${error.message}`);
    }
  }

  // Get user's canvas rooms
  async getUserCanvasRooms(userId, userRole) {
    try {
      const rooms = await CanvasModel.getUserRooms(userId, userRole);
      
      return {
        success: true,
        rooms,
        total: rooms.length
      };
    } catch (error) {
      throw new Error(`CanvasService - getUserCanvasRooms: ${error.message}`);
    }
  }

  // Get company canvas rooms (for admin dashboard)
  async getCompanyCanvasRooms(companyId, options = {}) {
    try {
      const result = await CanvasModel.getCompanyRooms(companyId, options);
      
      return {
        success: true,
        ...result
      };
    } catch (error) {
      throw new Error(`CanvasService - getCompanyCanvasRooms: ${error.message}`);
    }
  }

  // Update room settings
  async updateRoomSettings(roomId, userId, userRole, settings) {
    try {
      // Verify user has permission (must be creator or admin)
      const room = await CanvasModel.getRoomById(roomId);
      
      if (room.created_by !== userId && userRole !== 'admin') {
        throw new Error('Only room creator or admin can update settings');
      }

      const updatedRoom = await CanvasModel.updateRoom(roomId, {
        settings: {
          ...room.settings,
          ...settings
        }
      });

      return {
        success: true,
        room: updatedRoom,
        message: 'Room settings updated successfully'
      };
    } catch (error) {
      throw new Error(`CanvasService - updateRoomSettings: ${error.message}`);
    }
  }

  // Close room
  async closeRoom(roomId, userId, userRole) {
    try {
      // Verify user has permission (must be creator or admin)
      const room = await CanvasModel.getRoomById(roomId);
      
      if (room.created_by !== userId && userRole !== 'admin') {
        throw new Error('Only room creator or admin can close the room');
      }

      const closedRoom = await CanvasModel.closeRoom(roomId);

      return {
        success: true,
        room: closedRoom,
        message: 'Room closed successfully'
      };
    } catch (error) {
      throw new Error(`CanvasService - closeRoom: ${error.message}`);
    }
  }
}

export default new CanvasService();