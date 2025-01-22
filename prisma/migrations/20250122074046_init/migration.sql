-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tg_id" TEXT NOT NULL,
    "not" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ton" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usdt" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_tg_id_key" ON "User"("tg_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transaction_id_key" ON "Transaction"("transaction_id");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
