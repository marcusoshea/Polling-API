import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePollingOrderDto {
    @IsString()
    public polling_order_name: string;

    @IsNotEmpty()
    public polling_order_admin: number;
    
    @IsNotEmpty()
    public polling_order_admin_assistant: number;

    @IsNotEmpty()
    polling_order_notes_time_visible: number;

    @IsNotEmpty()
    public authToken: string;

}

export class EditPollingOrderDto {
    @IsString()
    public polling_order_name: string;

    @IsNotEmpty()
    public polling_order_admin: number;

    @IsNotEmpty()
    public polling_order_admin_assistant: number;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    polling_order_notes_time_visible: number;

    @IsNotEmpty()
    public authToken: string;
}

export class DeletePollingOrderDto {
    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public authToken: string;
}

