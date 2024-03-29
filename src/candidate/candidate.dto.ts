import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, isBoolean } from 'class-validator';

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

    @IsBoolean()
    public watch_list: boolean;
}

export class DeleteCandidateDto {
    @IsNotEmpty()
    public candidate_id: number;

    @IsNotEmpty()
    public authToken: string;
}

export class DeleteCandidateImageDto {
    @IsNotEmpty()
    public image_id: string;

    @IsNotEmpty()
    public candidate_id: number;
    
    @IsNotEmpty()
    public keys: string;

    @IsNotEmpty()
    public authToken: string;

    @IsNotEmpty()
    public all: boolean;
}

