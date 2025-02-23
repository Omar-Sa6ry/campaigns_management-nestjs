import { registerEnumType } from '@nestjs/graphql'

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum PartnerStatus {
  PENDING = 'pending',
  APPROVES = 'approved',
  REJECTED = 'rejected',
}

export enum TicketType {
  EXPIRED = 'expired',
  VAILD = 'valid',
}

export enum InterActionType {
  VIEW = 'view',
  CLICK = 'click',
}

export enum AdStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum AdType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  BANNER = 'BANNER',
}

registerEnumType(Role, { name: 'Role' })
registerEnumType(TicketType, { name: 'TicketType' })
registerEnumType(InterActionType, { name: 'InterActionType' })
registerEnumType(CampaignStatus, { name: 'CampaignStatus' })
registerEnumType(PartnerStatus, { name: 'PartnerStatus' })
registerEnumType(AdStatus, { name: 'AdStatus' })
registerEnumType(AdType, { name: 'AdType' })
registerEnumType(CampaignStatus, { name: 'CampaignStatus' })
