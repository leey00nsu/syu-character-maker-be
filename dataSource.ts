import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: 'syu-character-maker',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: ['migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: true,
});

export default dataSource;
