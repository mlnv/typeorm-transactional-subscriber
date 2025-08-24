import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Person } from './entities/Person';
import { Company } from './entities/Company';
import { EntityEventSubscriber } from './EntityEventSubscriber';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'test',
  synchronize: true,
  logging: false,
  entities: [Person, Company],
  subscribers: [EntityEventSubscriber],
});
