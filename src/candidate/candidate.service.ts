import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCandidateDto, DeleteCandidateDto, EditCandidateDto, CreateCandidateImageDto, DeleteCandidateImageDto } from './candidate.dto';
import { Candidate } from './candidate.entity';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';
import { ExternalNotes } from '../external_notes/external_notes.entity';
import { PollingNotes } from '../polling_notes/polling_notes.entity';
import { TypeOrmConfigService } from '../shared/typeorm/typeorm.service'
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { CandidateImages } from './candidate_images.entity';

@Injectable()

export class CandidateService {
  AWS_S3_BUCKET = process.env.AWS_BUCKET_NAME;
  s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  constructor(private jwtTokenService: JwtService, public authService: AuthService, public typeOrmConfigService: TypeOrmConfigService) {
  }
  private readonly logger = new Logger(CandidateService.name)
  @InjectRepository(Candidate)
  @InjectRepository(PollingOrder)
  @InjectRepository(ExternalNotes)
  @InjectRepository(PollingNotes)
  @InjectRepository(CandidateImages)

  private readonly repository!: Repository<Candidate>;

  public getCandidateById(id: number): Promise<Candidate> {
    return this.repository.findOneBy({
      candidate_id: id
    });
  }

  public async createCandidate(body: CreateCandidateDto): Promise<Candidate> {
    const candidate: Candidate = new Candidate();
    candidate.name = body.name;
    candidate.link = body.link;
    candidate.polling_order_id = body.polling_order_id;
    return this.repository.save(candidate);
  }

  public async createCandidateImage(file: any, data: CreateCandidateImageDto) {
    if (!this.authService.isOrderAdmin(data.authToken)) {
      throw new UnauthorizedException();
    }
    await this.s3_upload(file.buffer, this.AWS_S3_BUCKET, file.originalname.toString(), file.mimetype).then(() => {
      const candidateImages: CandidateImages = new CandidateImages();
      candidateImages.aws_key = file.originalname;
      candidateImages.candidate_id = data.candidate_id;
      candidateImages.image_description = data.imageDesc;

      this.repository
        .createQueryBuilder()
        .insert()
        .into(CandidateImages)
        .values(candidateImages)
        .execute()
    }
    );
  }

  public async s3_upload(file: Buffer, bucket: string, name: string, mimetype: string) {
    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: bucket,
          Key: String(name),
          Body: file,
          ACL: 'public-read',
          ContentType: mimetype,
          ContentDisposition: 'inline',
        },
      });
      const s3Response = await upload.done();
      console.log(s3Response);
    }
    catch (e) {
      console.log(e);
    }
  }

  public async deleteCandidateImage(body: DeleteCandidateImageDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    let keys = body.keys;
    let all = body.all;
    let data = this.typeOrmConfigService.workDataSource();

    data.initialize().then(newdata => {
      if (all) {
        let candidate_id = body.candidate_id;
        newdata.createQueryBuilder()
          .select(['aws_key as "Key"'])
          .from(CandidateImages, 'images')
          .where('candidate_id = :candidate_id', { candidate_id })
          .execute()
          .then((response: any) =>
            newdata.createQueryBuilder()
              .delete()
              .from(CandidateImages)
              .where('candidate_id = :candidate_id', { candidate_id })
              .execute()
              .then(() =>
                this.s3_delete(response)
              )
          )
      } else {
        let image_id = body.image_id;
        newdata.createQueryBuilder()
          .delete()
          .from(CandidateImages)
          .where('image_id = :image_id', { image_id })
          .execute()
          .then(() =>
            this.s3_delete(keys)
          )
      }
    });

    return true;
  }

  public async s3_delete(names: any) {
    try {
      const response = await this.s3.send(new DeleteObjectsCommand({
        Bucket: 'aepolling.org',
        Delete: {
          Objects: names,
          Quiet: false,
        },
      }));
      console.log('delete successfully', response);
    }
    catch (e) {
      console.log(e);
    }
  }

  public async editCandidate(body: EditCandidateDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }

    let linkString = '';
    if (body.link !== null && body.link !== '') {
      linkString = body.link;
    }

    const bodyUpdate = {
      candidate_id: body.candidate_id,
      link: linkString,
      name: body.name,
      polling_order_id: body.polling_order_id,
      watch_list: body.watch_list
    }
    await this.repository.update(body.candidate_id, bodyUpdate);
    return true;
  }

  public async deleteCandidate(body: DeleteCandidateDto): Promise<boolean> {
    let candidateId = body.candidate_id;
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    let data = this.typeOrmConfigService.workDataSource();
    data.initialize().then(newdata =>
      newdata.createQueryBuilder()
        .delete()
        .from(ExternalNotes)
        .where('candidate_id = :candidateId', { candidateId })
        .execute()
        .then(() =>
          newdata.createQueryBuilder()
            .delete()
            .from(PollingNotes)
            .where('candidate_id = :candidateId', { candidateId })
            .execute()
            .then(() =>
              this.repository.delete(body.candidate_id)
            )
        )
    );

    let bodyImage: DeleteCandidateImageDto = {
      image_id: '',
      candidate_id: candidateId,
      keys: '',
      authToken: body.authToken,
      all: true
    }

    this.deleteCandidateImage(bodyImage);
    return true;
  }

  public async getAllCandidates(orderId: number): Promise<Candidate[]> {
    const result = await this.repository
      .createQueryBuilder('candidate')
      .select(['candidate'])
      .where('candidate.polling_order_id = :orderId', { orderId })
      .orderBy('name')
      .getMany();
    return result;
  }

  public async getAllCandidateImages(candidate_id: number): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'candidate')
      .addSelect('t2.*', 'candidateimages')
      .innerJoin(CandidateImages, 't2', 't1.candidate_id = t2.candidate_id')
      .where('t1.candidate_id = :candidate_id', { candidate_id })
      .getRawMany()
    return result;
  }

}
