import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public authToken: string;
}

export class EditCandidateDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public authToken: string;
}

export class DeleteCandidateDto {
    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public authToken: string;
}

