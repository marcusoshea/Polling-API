import { IsNotEmpty, IsString } from 'class-validator';

export interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
  }

export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    public name: string;
    
    @IsString()
    public link: string;

    @IsNotEmpty()
    public polling_order_id: number;

    @IsNotEmpty()
    public authToken: string;
}

export class CreateCandidateImageDto {
    @IsNotEmpty()
    public candidate_id: number;
    @IsNotEmpty()
    public file: File;
    @IsNotEmpty()
    public authToken: string;
}

export class EditCandidateDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsString()
    public link: string;

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

