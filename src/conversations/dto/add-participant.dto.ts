import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ParticipantRole } from '../../users/entities/participants.entity';

export class AddParticipantDto {
  @ApiProperty({
    example: 'user-uuid-123',
    description: 'ID of the user to add as participant',
  })
  @IsUUID('4')
  userId: string;

  @ApiPropertyOptional({
    enum: ParticipantRole,
    example: ParticipantRole.MEMBER,
    description: 'Role of the participant in the conversation',
  })
  @IsOptional()
  @IsEnum(ParticipantRole)
  role?: ParticipantRole = ParticipantRole.MEMBER;
}
