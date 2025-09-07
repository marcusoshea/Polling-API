import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrderPoliciesService } from './order_policies.service';
import { CreateOrderPolicyDto, UpdateOrderPolicyDto, GetOrderPolicyDto, DeleteOrderPolicyDto, OrderPolicyResponseDto } from './order_policies.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('order-policies')
@UseGuards(JwtAuthGuard)
export class OrderPoliciesController {
  constructor(private readonly orderPoliciesService: OrderPoliciesService) {}

  /**
   * Create a new order policy
   * POST /order-policies
   */
  @Post()
  async createOrderPolicy(@Body() body: CreateOrderPolicyDto): Promise<OrderPolicyResponseDto> {
    return await this.orderPoliciesService.createOrderPolicy(body);
  }

  /**
   * Get order policy by polling order ID
   * GET /order-policies/polling-order/:pollingOrderId
   */
  @Get('polling-order/:pollingOrderId')
  async getOrderPolicyByPollingOrderId(
    @Param('pollingOrderId', ParseIntPipe) pollingOrderId: number,
    @Req() request: Request
  ): Promise<OrderPolicyResponseDto | null> {
    // Extract the actual JWT token from the Authorization header
    const authHeader = request.headers.authorization;
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    const body: GetOrderPolicyDto = {
      polling_order_id: pollingOrderId,
      authToken: authToken,
    };
    return await this.orderPoliciesService.getOrderPolicyByPollingOrderId(body);
  }

  /**
   * Update an existing order policy
   * PUT /order-policies/:id
   */
  @Put(':id')
  async updateOrderPolicy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<UpdateOrderPolicyDto, 'order_policy_id'>,
    @Req() request: Request
  ): Promise<OrderPolicyResponseDto> {
    // Extract the actual JWT token from the Authorization header
    const authHeader = request.headers.authorization;
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    const updateDto: UpdateOrderPolicyDto = {
      order_policy_id: id,
      ...body,
      authToken: authToken,
    };
    return await this.orderPoliciesService.updateOrderPolicy(updateDto);
  }

  /**
   * Delete an order policy
   * DELETE /order-policies/:id
   */
  @Delete(':id')
  async deleteOrderPolicy(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request
  ): Promise<{ message: string }> {
    // Extract the actual JWT token from the Authorization header
    const authHeader = request.headers.authorization;
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    const body: DeleteOrderPolicyDto = {
      order_policy_id: id,
      authToken: authToken,
    };
    await this.orderPoliciesService.deleteOrderPolicy(body);
    return { message: 'Order policy deleted successfully' };
  }

  /**
   * Get all order policies (admin only)
   * GET /order-policies
   */
  @Get()
  async getAllOrderPolicies(@Req() request: Request): Promise<OrderPolicyResponseDto[]> {
    // Extract the actual JWT token from the Authorization header
    const authHeader = request.headers.authorization;
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    return await this.orderPoliciesService.getAllOrderPolicies(authToken);
  }
}
