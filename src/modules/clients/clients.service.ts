import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { ClientDesignerAssignment } from '../../entities/client-designer-assignment.entity.js';
import { Order } from '../../entities/order.entity.js';
import { UserRole } from '../../entities/enums.js';
import { AssignDesignerDto } from './dto/assign-designer.dto.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClientDesignerAssignment)
    private readonly assignmentRepo: Repository<ClientDesignerAssignment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async assignDesigner(clientId: string, dto: AssignDesignerDto, assignedById: string) {
    const client = await this.userRepo.findOne({ where: { id: clientId, role: UserRole.CLIENT } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const designer = await this.userRepo.findOne({ where: { id: dto.designer_id, role: UserRole.DESIGN } });
    if (!designer) {
      throw new BadRequestException('Designer not found or user is not a designer');
    }

    let assignment = await this.assignmentRepo.findOne({ where: { client_id: clientId } });
    if (assignment) {
      assignment.designer_id = dto.designer_id;
      assignment.assigned_by = assignedById;
    } else {
      assignment = this.assignmentRepo.create({
        client_id: clientId,
        designer_id: dto.designer_id,
        assigned_by: assignedById,
      });
    }

    const savedAssignment = await this.assignmentRepo.save(assignment);

    // Persist handled_by_designer_id onto all orders of this client
    await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ handled_by_designer_id: dto.designer_id })
      .where('client_id = :clientId', { clientId })
      .execute();

    return savedAssignment;
  }

  async getDesigner(clientId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { client_id: clientId },
      relations: { designer: true },
    });
    if (!assignment) {
      throw new NotFoundException('No designer assigned to this client');
    }
    return assignment;
  }

  async listClients() {
    return this.userRepo.find({
      where: { role: UserRole.CLIENT },
      order: { created_at: 'DESC' },
    });
  }
}
