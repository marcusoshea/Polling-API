import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePollingDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public start_date: string;

    @IsNotEmpty()
    public end_date: string;

    @IsNotEmpty()
    public authToken: string;
}

export class EditPollingDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public polling_id: number;

    @IsNotEmpty()
    public start_date: string;

    @IsNotEmpty()
    public end_date: string;

    @IsNotEmpty()
    public authToken: string;
}

export class DeletePollingDto {
    @IsNotEmpty()
    public polling_id: number;

    @IsNotEmpty()
    public authToken: string;
}

export class AddPollingCandidateDto {
    @IsNotEmpty()
    public polling_id: number;
    @IsNotEmpty()
    public candidate_id: number;
    @IsNotEmpty()
    public authToken: string;
}

export class RemovePollingCandidateDto {
    @IsNotEmpty()
    public polling_candidate_id: number;

    @IsNotEmpty()
    public authToken: string;
}