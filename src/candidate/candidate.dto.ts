import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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

    @ApiProperty({ required: false })
    @IsString()
    imageDesc?: string

    @ApiProperty({ required: false })
    @IsString()
    authToken?: string

    @ApiProperty({ type: 'string', format: 'number', required: false })
    @IsNumber()
    candidate_id?: number

    @ApiProperty({ type: 'string', format: 'binary', required: true })
    file: Express.Multer.File

    public filename: string;
    public fieldname:any;
    public originalname:any;
    public ncoding:any;
    public mimetype:any;
    public buffer:any;
    public size:any;
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

