-- CreateTable
CREATE TABLE "rates" (
    "id" SERIAL NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "date" DATE,
    "cost" VARCHAR(10) NOT NULL,
    "sale" VARCHAR(10) NOT NULL,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);
