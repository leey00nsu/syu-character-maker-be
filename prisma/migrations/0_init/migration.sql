-- CreateTable
CREATE TABLE "article" (
    "id" SERIAL NOT NULL,
    "canvasName" VARCHAR NOT NULL,
    "imageUrl" VARCHAR NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" INTEGER,

    CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liked_by" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "PK_e97aaf39c77ee0533ce01ea15ca" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "provider" VARCHAR NOT NULL,
    "providerId" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "photo" VARCHAR NOT NULL,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "FK_a9c5f4ec6cceb1604b4a3c84c87" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "liked_by" ADD CONSTRAINT "FK_ba5875a744cbec464c384d3f72a" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "liked_by" ADD CONSTRAINT "FK_edebe483970d1b27bc7b2229960" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

