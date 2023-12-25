import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1703359077438 implements MigrationInterface {
    name = 'Migration1703359077438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "liked_by" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "articleId" integer NOT NULL, CONSTRAINT "PK_e97aaf39c77ee0533ce01ea15ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "provider" character varying NOT NULL, "providerId" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "photo" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "article" ("id" SERIAL NOT NULL, "canvasName" character varying NOT NULL, "imageUrl" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "authorId" integer, CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "liked_by" ADD CONSTRAINT "FK_edebe483970d1b27bc7b2229960" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "liked_by" ADD CONSTRAINT "FK_ba5875a744cbec464c384d3f72a" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_a9c5f4ec6cceb1604b4a3c84c87" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_a9c5f4ec6cceb1604b4a3c84c87"`);
        await queryRunner.query(`ALTER TABLE "liked_by" DROP CONSTRAINT "FK_ba5875a744cbec464c384d3f72a"`);
        await queryRunner.query(`ALTER TABLE "liked_by" DROP CONSTRAINT "FK_edebe483970d1b27bc7b2229960"`);
        await queryRunner.query(`DROP TABLE "article"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "liked_by"`);
    }

}
