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

  @IsNotEmpty()
  public pom_created_at: string;

  @IsNotEmpty()
  public authToken: string;
}

export class EditMemberDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsEmail()
  @IsNotEmpty()
  public email: string;
  
  @IsNotEmpty()
  public polling_order_id: number;

  @IsNotEmpty()
  public polling_order_member_id: number;

  @IsNotEmpty()
  public authToken: string;

  @IsNotEmpty()
  public pom_created_at: string;
}

export class DeleteMemberDto {
  @IsNotEmpty()
  public polling_order_member_id: number;

  @IsNotEmpty()
  public authToken: string;
}

