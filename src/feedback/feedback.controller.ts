import { Body, Controller, Post } from '@nestjs/common';
import { FeedbackDto } from './feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async sendFeedback(@Body() feedbackDto: FeedbackDto): Promise<{ message: string }> {
    await this.feedbackService.sendFeedback(feedbackDto);
    return { message: 'Feedback sent successfully' };
  }
}