import { Injectable } from '@nestjs/common';
import { CreateTrackDto } from './dto/create-track.dto';
import { FileService, FileType } from '../file/file.service';
import { PrismaService } from '../prisma.service';
import { Track, Comment } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class TrackService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(dto: CreateTrackDto, picture, audio): Promise<Track> {
    const audioPath = this.fileService.createFile(FileType.AUDIO, audio);
    const picturePath = this.fileService.createFile(FileType.IMAGE, picture);
    const track = await this.prisma.track.create({
      data: {
        ...dto,
        listens: 0,
        audio: audioPath,
        picture: picturePath,
      },
    });
    return track;
  }

  async getAll(count = 10, offset = 0): Promise<Track[]> {
    const tracks = await this.prisma.track.findMany({
      skip: offset,
      take: count,
    });
    return tracks;
  }

  async getOne(id: string): Promise<Track> {
    const track = await this.prisma.track.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        comments: {
          where: {
            trackId: Number(id),
          },
        },
      },
    });
    return track;
  }

  async delete(id: string): Promise<number> {
    // const track = await this.prisma.track.delete({ where: { id: Number(id) }, include: {
    //   comments: {where: {
    //     trackId: Number(id)
    //     }}
    //   }});
    // return track.id;
    const deleteComments = this.prisma.comment.deleteMany({
      where: {
        trackId: Number(id),
      },
    })

    const deleteTrack = this.prisma.track.delete({
      where: {
        id: Number(id),
      },
    })

    const transaction = await this.prisma.$transaction([deleteComments, deleteTrack])
    console.log(transaction);
    return transaction[1].id
  }

  async addComment(dto: CreateCommentDto): Promise<Comment> {
    const comment = await this.prisma.comment.create({
      data: {
        username: dto.username,
        text: dto.text,
        trackId: Number(dto.trackId),
      },
    });
    return comment;
  }

  async listen(id: string) {
    const track = await this.prisma.track.update({
      where: {
        id: Number(id),
      },
      data: {
        listens: {
          increment: 1,
        },
      },
    });
  }

  async search(query: string): Promise<Track[]> {
    const tracks = await this.prisma.track.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            artist: {
              contains: query,
            },
          },
        ],
      },
    });
    return tracks;
  }
}
