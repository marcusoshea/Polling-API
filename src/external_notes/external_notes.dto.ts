import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateExternalNoteDto {
    @IsString()
    public external_note: string;

    @IsNotEmpty()
    public polling_order_member_id: number;

    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public en_created_at: string;

    @IsNotEmpty()
    public authToken: string;
}

export class EditExternalNoteDto {
    @IsNotEmpty()
    public external_notes_id: number;
    
    @IsString()
    public external_note: string;

    @IsNotEmpty()
    public polling_order_member_id: number;

    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public en_created_at: string;

    @IsNotEmpty()
    public authToken: string;
}

export class DeleteExternalNoteDto {
    @IsNotEmpty()
    public external_notes_id: number;

    @IsNotEmpty()
    public polling_order_member_id: number;

    @IsNotEmpty()
    public authToken: string;
}

