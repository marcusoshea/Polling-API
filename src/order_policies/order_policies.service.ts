import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderPolicies } from './order_policies.entity';
import { CreateOrderPolicyDto, UpdateOrderPolicyDto, GetOrderPolicyDto, DeleteOrderPolicyDto, OrderPolicyResponseDto } from './order_policies.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class OrderPoliciesService {
  constructor(
    @InjectRepository(OrderPolicies)
    private readonly orderPoliciesRepository: Repository<OrderPolicies>,
    private readonly authService: AuthService,
  ) {}

  /**
   * Create a new order policy for a polling order
   */
  public async createOrderPolicy(body: CreateOrderPolicyDto): Promise<OrderPolicyResponseDto> {
    // Check if user is authorized (admin or admin assistant)
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException('Only polling order administrators can create policies');
    }

    // Check if user is trying to create policy for their own polling order
    const userPollingOrderId = this.authService.getPollingOrderId(body.authToken);
    if (userPollingOrderId !== body.polling_order_id) {
      throw new UnauthorizedException('You can only create policies for your own polling order');
    }

    // Check if a policy already exists for this polling order
    const existingPolicy = await this.orderPoliciesRepository.findOne({
      where: { polling_order_id: body.polling_order_id }
    });

    if (existingPolicy) {
      throw new BadRequestException('A policy already exists for this polling order. Use update instead.');
    }

    // Create new policy
    const orderPolicy = this.orderPoliciesRepository.create({
      polling_order_id: body.polling_order_id,
      polling_order_policy: body.polling_order_policy || null,
    });

    const savedPolicy = await this.orderPoliciesRepository.save(orderPolicy);
    return this.mapToResponseDto(savedPolicy);
  }

  /**
   * Get order policy by polling order ID
   */
  public async getOrderPolicyByPollingOrderId(body: GetOrderPolicyDto): Promise<OrderPolicyResponseDto | null> {
    try {
      console.log('OrderPoliciesService.getOrderPolicyByPollingOrderId called with:', body);
      
      // Get user's polling order ID
      const userPollingOrderId = this.authService.getPollingOrderId(body.authToken);
      console.log('User polling order ID:', userPollingOrderId);
      
      // Check if user is trying to view policy for their own polling order
      if (userPollingOrderId !== body.polling_order_id) {
        console.log('User trying to access different polling order');
        throw new UnauthorizedException('You can only view policies for your own polling order');
      }

      const policy = await this.orderPoliciesRepository.findOne({
        where: { polling_order_id: body.polling_order_id }
      });

      console.log('Found policy:', policy);

      if (!policy) {
        return null;
      }

      return this.mapToResponseDto(policy);
    } catch (error) {
      console.error('Error in getOrderPolicyByPollingOrderId:', error);
      throw error;
    }
  }

  /**
   * Update an existing order policy
   */
  public async updateOrderPolicy(body: UpdateOrderPolicyDto): Promise<OrderPolicyResponseDto> {
    // Check if user is authorized (admin or admin assistant)
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException('Only polling order administrators can update policies');
    }

    // Find existing policy
    const existingPolicy = await this.orderPoliciesRepository.findOne({
      where: { order_policy_id: body.order_policy_id }
    });

    if (!existingPolicy) {
      throw new NotFoundException('Order policy not found');
    }

    // Check if user is trying to update policy for their own polling order
    const userPollingOrderId = this.authService.getPollingOrderId(body.authToken);
    if (userPollingOrderId !== existingPolicy.polling_order_id) {
      throw new UnauthorizedException('You can only update policies for your own polling order');
    }

    // Update policy
    existingPolicy.polling_order_policy = body.polling_order_policy || existingPolicy.polling_order_policy;
    
    const updatedPolicy = await this.orderPoliciesRepository.save(existingPolicy);
    return this.mapToResponseDto(updatedPolicy);
  }

  /**
   * Delete an order policy
   */
  public async deleteOrderPolicy(body: DeleteOrderPolicyDto): Promise<boolean> {
    // Check if user is authorized (admin or admin assistant)
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException('Only polling order administrators can delete policies');
    }

    // Find existing policy
    const existingPolicy = await this.orderPoliciesRepository.findOne({
      where: { order_policy_id: body.order_policy_id }
    });

    if (!existingPolicy) {
      throw new NotFoundException('Order policy not found');
    }

    // Check if user is trying to delete policy for their own polling order
    const userPollingOrderId = this.authService.getPollingOrderId(body.authToken);
    if (userPollingOrderId !== existingPolicy.polling_order_id) {
      throw new UnauthorizedException('You can only delete policies for your own polling order');
    }

    // Delete policy
    await this.orderPoliciesRepository.remove(existingPolicy);
    return true;
  }

  /**
   * Get all order policies for the user's polling order (admin only)
   */
  public async getAllOrderPolicies(authToken: string): Promise<OrderPolicyResponseDto[]> {
    // Check if user is authorized (admin or admin assistant)
    if (!this.authService.isOrderAdmin(authToken)) {
      throw new UnauthorizedException('Only polling order administrators can view policies');
    }

    // Get user's polling order ID
    const userPollingOrderId = this.authService.getPollingOrderId(authToken);

    const policies = await this.orderPoliciesRepository.find({
      where: { polling_order_id: userPollingOrderId },
      order: { created_at: 'DESC' }
    });

    return policies.map(policy => this.mapToResponseDto(policy));
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(policy: OrderPolicies): OrderPolicyResponseDto {
    return {
      order_policy_id: policy.order_policy_id,
      polling_order_id: policy.polling_order_id,
      polling_order_policy: policy.polling_order_policy,
      created_at: policy.created_at,
      updated_at: policy.updated_at,
    };
  }
}
