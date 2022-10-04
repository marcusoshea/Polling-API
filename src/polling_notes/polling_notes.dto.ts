import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreatePollingNoteDto {
    @IsString()
    public note: string;

    public vote: number;

    @IsNotEmpty()
    public polling_id: number;

    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public pn_created_at: string;

    @IsNotEmpty()
    public polling_order_member_id: number;

    @IsBoolean()
    @Transform(({ obj, key }) => obj[key] === 'true')
    public completed: boolean;

    @IsNotEmpty()
    public authToken: string;
}

export class EditPollingNoteDto {
    @IsNotEmpty()
    public polling_notes_id: number;

    @IsString()
    public note: string;

    public vote: number;

    @IsNotEmpty()
    public polling_id: number;

    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public pn_created_at: string;

    @IsNotEmpty()
    public polling_order_member_id: number;
    
    @IsBoolean()
    @Transform(({ obj, key }) => obj[key] === 'true')
    public completed: boolean;

    @IsNotEmpty()
    public authToken: string;
}

export class DeletePollingNoteDto {
    @IsNotEmpty()
    public polling_notes_id: number;

    @IsNotEmpty()
    public authToken: string;
}

