export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  DESIGN = 'design',
  OPERATIONS = 'operations',
  WAREHOUSE = 'warehouse',
  CUTTING = 'cutting',
  CNC = 'cnc',
  EDGE_BANDING = 'edge_banding',
  QC = 'qc',
}

export enum OrderStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  READY_FOR_PRODUCTION = 'ready_for_production',
  IN_PRODUCTION = 'in_production',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PriceOfferStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
}

export enum DesignStatus {
  DRAFTING = 'drafting',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
}

export enum MilestoneDepartment {
  CUTTING = 'cutting',
  CNC = 'cnc',
  EDGE_BANDING = 'edge_banding',
}

export enum MilestoneEvent {
  ACKNOWLEDGED = 'acknowledged',
  DONE = 'done',
}

export enum QcResult {
  PASS = 'pass',
  FAIL = 'fail',
}

export enum InventoryCategory {
  PERISHABLE = 'perishable',
  NON_PERISHABLE = 'non_perishable',
}

export enum TransactionType {
  ACQUISITION = 'acquisition',
  WITHDRAWAL = 'withdrawal',
}

export enum MessageChannel {
  TELEGRAM = 'telegram',
  WEB = 'web',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
}

export enum RegistrationCodeStatus {
  ACTIVE = 'active',
  USED = 'used',
  REVOKED = 'revoked',
}
