import { IsEmail, IsNotEmpty, isNumber, IsString } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsEmail()
  public email: string;
  
  @IsString()
  @IsNotEmpty()
  public password: string;
  
  @IsNotEmpty()
  public polling_order_id: number;
  
}
