import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity.js';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: string;
    actorId?: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    return this.auditRepo.save(
      this.auditRepo.create({
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
        actor_id: params.actorId || null,
        changes: params.changes || null,
        metadata: params.metadata || null,
      }),
    );
  }

  async getByEntity(entityType: string, entityId: string) {
    return this.auditRepo.find({
      where: { entity_type: entityType, entity_id: entityId },
      order: { created_at: 'DESC' },
    });
  }
}
