import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WebSocketService } from '../websocket/websocket.service';

export interface CallParticipant {
  userId: string;
  socketId: string;
  joined: boolean;
  muted: boolean;
  videoEnabled: boolean;
}

export interface ActiveCall {
  id: string;
  conversationId: string;
  type: 'audio' | 'video';
  initiatorId: string;
  participants: Map<string, CallParticipant>;
  startedAt: Date;
  status: 'ringing' | 'active' | 'ended';
}

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  private activeCalls = new Map<string, ActiveCall>();

  constructor(
    @Inject(forwardRef(() => WebSocketService))
    private websocketService: WebSocketService
  ) { }

  async initiateCall(
    callId: string,
    conversationId: string,
    initiatorId: string,
    type: 'audio' | 'video',
    participantIds: string[],
  ): Promise<ActiveCall> {
    const call: ActiveCall = {
      id: callId,
      conversationId,
      type,
      initiatorId,
      participants: new Map(),
      startedAt: new Date(),
      status: 'ringing',
    };

    // Add initiator as first participant
    call.participants.set(initiatorId, {
      userId: initiatorId,
      socketId: '', // Will be updated when they join
      joined: false,
      muted: false,
      videoEnabled: type === 'video',
    });

    // Add other participants
    participantIds.forEach((userId) => {
      call.participants.set(userId, {
        userId,
        socketId: '',
        joined: false,
        muted: false,
        videoEnabled: type === 'video',
      });
    });

    this.activeCalls.set(callId, call);

    // Send call invitations to all participants
    await this.sendCallInvitations(call);

    this.logger.log(`Call ${callId} initiated by ${initiatorId}`);
    return call;
  }

  async joinCall(
    callId: string,
    userId: string,
    socketId: string,
  ): Promise<boolean> {
    const call = this.activeCalls.get(callId);
    if (!call || call.status === 'ended') {
      return false;
    }

    const participant = call.participants.get(userId);
    if (!participant) {
      return false;
    }

    participant.joined = true;
    participant.socketId = socketId;

    // Notify other participants
    await this.notifyParticipants(callId, 'participant_joined', {
      userId,
      participant,
    });

    // If this is the first person to join (besides initiator), start the call
    const joinedCount = Array.from(call.participants.values()).filter(
      (p) => p.joined,
    ).length;
    if (joinedCount >= 2 && call.status === 'ringing') {
      call.status = 'active';
      await this.notifyParticipants(callId, 'call_started', { callId });
    }

    this.logger.log(`User ${userId} joined call ${callId}`);
    return true;
  }

  async leaveCall(callId: string, userId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.get(userId);
    if (participant) {
      participant.joined = false;
    }

    // Notify other participants
    await this.notifyParticipants(callId, 'participant_left', { userId });

    // Check if call should end
    const activeParticipants = Array.from(call.participants.values()).filter(
      (p) => p.joined,
    );
    if (activeParticipants.length <= 1) {
      await this.endCall(callId);
    }

    this.logger.log(`User ${userId} left call ${callId}`);
  }

  async endCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    call.status = 'ended';

    // Notify all participants
    await this.notifyParticipants(callId, 'call_ended', { callId });

    this.activeCalls.delete(callId);
    this.logger.log(`Call ${callId} ended`);
  }

  async handleSignalingMessage(
    callId: string,
    fromUserId: string,
    toUserId: string,
    type: string,
    data: any,
  ): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const toParticipant = call.participants.get(toUserId);
    if (!toParticipant || !toParticipant.joined) return;

    // Forward signaling message to specific participant
    await this.websocketService.sendToUser(toUserId, 'webrtc_signaling', {
      callId,
      fromUserId,
      type,
      data,
    });
  }

  async toggleMute(
    callId: string,
    userId: string,
    muted: boolean,
  ): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.get(userId);
    if (participant) {
      participant.muted = muted;
      await this.notifyParticipants(callId, 'participant_mute_changed', {
        userId,
        muted,
      });
    }
  }

  async toggleVideo(
    callId: string,
    userId: string,
    videoEnabled: boolean,
  ): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.get(userId);
    if (participant) {
      participant.videoEnabled = videoEnabled;
      await this.notifyParticipants(callId, 'participant_video_changed', {
        userId,
        videoEnabled,
      });
    }
  }

  getActiveCall(callId: string): ActiveCall | undefined {
    return this.activeCalls.get(callId);
  }

  getUserActiveCalls(userId: string): ActiveCall[] {
    return Array.from(this.activeCalls.values()).filter(
      (call) => call.participants.has(userId) && call.status !== 'ended',
    );
  }

  private async sendCallInvitations(call: ActiveCall): Promise<void> {
    const invitationData = {
      callId: call.id,
      conversationId: call.conversationId,
      initiatorId: call.initiatorId,
      type: call.type,
      participants: Array.from(call.participants.keys()),
    };

    // Send to all participants except initiator
    for (const [userId] of call.participants) {
      if (userId !== call.initiatorId) {
        await this.websocketService.sendToUser(
          userId,
          'incoming_call',
          invitationData,
        );
      }
    }
  }

  private async notifyParticipants(
    callId: string,
    event: string,
    data: any,
  ): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    for (const [userId, participant] of call.participants) {
      if (participant.joined) {
        await this.websocketService.sendToUser(userId, event, {
          callId,
          ...data,
        });
      }
    }
  }
}
