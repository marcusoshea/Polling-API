import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
}

export class CreateCandidateDto {
    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsString()
    public link!: string;

    @IsNotEmpty()
    public polling_order_id!: number;

    @IsString()
    @IsNotEmpty()
    public authToken!: string;
}

export class CreateCandidateImageDto {
    @ApiProperty({ required: false })
    @IsString()
    imageDesc?: string;

    @ApiProperty({ required: false })
    @IsString()
    authToken?: string;

    @ApiProperty({ type: 'string', format: 'number', required: false })
    @Type(() => Number)
    @IsNumber()
    candidate_id?: number;

    @ApiProperty({ type: 'string', format: 'binary', required: true })
    file!: Express.Multer.File;

    public filename!: string;
    public fieldname!: string;
    public originalname!: string;
    public encoding!: string;
    public mimetype!: string;
    public buffer!: Buffer;
    public size!: number;
}

export class EditCandidateDto {
    @IsString()
    @IsNotEmpty()
    public name!: string;

    @IsOptional()
    @IsString()
    public link?: string;

    @Type(() => Number)
    @IsNotEmpty()
    public polling_order_id!: number;

    @Type(() => Number)
    @IsNotEmpty()
    public candidate_id!: number;

    @IsString()
    @IsNotEmpty()
    public authToken!: string;

    @IsBoolean()
    public watch_list!: boolean;
}

export class DeleteCandidateDto {
    @IsNotEmpty()
    public candidate_id!: number;

    @IsString()
    @IsNotEmpty()
    public authToken!: string;
}

export class DeleteCandidateImageDto {
    @IsNotEmpty()
    public image_id!: string;

    @IsNotEmpty()
    public candidate_id!: number;

    @IsNotEmpty()
    public keys!: string;

    @IsString()
    @IsNotEmpty()
    public authToken!: string;

    @IsNotEmpty()
    public all!: boolean;
}
