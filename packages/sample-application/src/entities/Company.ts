import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
    id!: number;

  @Column()
    name!: string;

  @DeleteDateColumn()
    deletedAt?: Date;
}
