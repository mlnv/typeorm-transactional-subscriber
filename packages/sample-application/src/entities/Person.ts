import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
    id!: number;

  @Column()
    name!: string;

  @DeleteDateColumn()
    deletedAt?: Date;
}
