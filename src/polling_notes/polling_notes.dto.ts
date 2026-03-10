import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePollingNoteDto {
    public polling_notes_id: number;

    @IsString()
    @IsNotEmpty()
    public note: string;

    @IsNumber()
    @IsNotEmpty()
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

    @IsBoolean()
    public private: boolean;

    @IsString()
    @IsNotEmpty()
    public authToken: string;
}

export class EditPollingNoteDto {
    @IsNotEmpty()
    public polling_notes_id: number;

    @IsString()
    @IsNotEmpty()
    public note: string;

    @IsNumber()
    @IsNotEmpty()
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

    @IsBoolean()
    public private: boolean;

    @IsString()
    @IsNotEmpty()
    public authToken: string;
}

export class DeletePollingNoteDto {
    @IsNotEmpty()
    public polling_notes_id: number;

    @IsString()
    @IsNotEmpty()
    public authToken: string;
}

export class GetAllPollingNoteDto {
    @IsNotEmpty()
    public polling_notes_id: number;

    @IsString()
    @IsNotEmpty()
    public authToken: string;
}
