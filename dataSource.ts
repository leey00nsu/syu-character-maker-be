import { config } from 'dotenv';
import { Article } from 'src/article/entities/article.entity';
import { LikedBy } from 'src/article/entities/likedBy.entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource } from 'typeorm';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: 'syu-character-maker',
  entities: [User, Article, LikedBy],
  migrations: ['migrations/*.ts'],
  migrationsTableName: 'migrations',
  migrationsRun: true,
});

export default dataSource;
