import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    const term = query.trim();
    if (!term || term.length < 2) {
      return { patients: [], appointments: [], dentists: [] };
    }

    const [patients, appointments, dentists] = await Promise.all([
      this.prisma.patient.findMany({
        where: {
          OR: [
            { pid: { contains: term, mode: 'insensitive' } },
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: {
          id: true,
          pid: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          OR: [
            {
              patient: {
                OR: [
                  { firstName: { contains: term, mode: 'insensitive' } },
                  { lastName: { contains: term, mode: 'insensitive' } },
                  { pid: { contains: term, mode: 'insensitive' } },
                ],
              },
            },
            { notes: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 8,
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, pid: true },
          },
          dentist: { select: { id: true, name: true } },
        },
      }),
      this.prisma.dentist.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { specialty: { contains: term, mode: 'insensitive' } },
          ],
          active: true,
        },
        take: 5,
      }),
    ]);

    return { patients, appointments, dentists };
  }
}
