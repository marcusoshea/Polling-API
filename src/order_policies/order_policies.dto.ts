import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateOrderPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  public polling_order_id: number;

  @IsOptional()
  @IsString()
  public polling_order_policy?: string;

  @IsNotEmpty()
  @IsString()
  public authToken: string;
}

export class UpdateOrderPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  public order_policy_id: number;

  @IsOptional()
  @IsString()
  public polling_order_policy?: string;

  @IsNotEmpty()
  @IsString()
  public authToken: string;
}

export class GetOrderPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  public polling_order_id: number;

  @IsNotEmpty()
  @IsString()
  public authToken: string;
}

export class DeleteOrderPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  public order_policy_id: number;

  @IsNotEmpty()
  @IsString()
  public authToken: string;
}

export class OrderPolicyResponseDto {
  public order_policy_id: number;
  public polling_order_id: number;
  public polling_order_policy: string;
  public created_at: Date;
  public updated_at: Date;
}
