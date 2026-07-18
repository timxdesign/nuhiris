import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload')
  @Roles(
    UserRole.MEDICAL_OFFICER,
    UserRole.NURSE,
    UserRole.LAB_SCIENTIST,
    UserRole.HEALTH_RECORDS_OFFICER,
  )
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.documentService.upload(
      file,
      dto.nuhi,
      dto.encounterId ?? null,
      dto.docType,
      user.sub,
    );
  }

  @Get(':docId')
  findById(@Param('docId', ParseUUIDPipe) docId: string) {
    return this.documentService.findById(docId);
  }

  @Get(':docId/download')
  async download(
    @Param('docId', ParseUUIDPipe) docId: string,
    @Res() res: Response,
  ) {
    const { stream, doc } = await this.documentService.getDownloadStream(docId);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.docId}.${doc.mimeType.split('/')[1]}"`);
    (stream as NodeJS.ReadableStream).pipe(res);
  }

  @Get('patient/:nuhi')
  findByPatient(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.documentService.findByPatient(nuhi);
  }

  @Get('encounter/:encounterId')
  findByEncounter(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.documentService.findByEncounter(encounterId);
  }
}
