import TonWeb from "tonweb";
import { AccountSubscription } from "./account/AccountSubscription.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://node.masonsplay.com/jsonRPC'));

const MY_WALLET_ADDRESS = 'UQBYwq42_KLe0BIuYHR1fBKbtvoumU9hAKvMuylJHYZCJzFn';

const onTransaction = async (tx) => {
    if (tx.in_msg.source && tx.out_msgs.length === 0) {
        if (tx.in_msg.msg_data && tx.in_msg.msg_data['@type'] !== 'msg.dataText') {
            return;
        }

        const transactionId = tx.transaction_id.lt + ':' + tx.transaction_id.hash;
        const value = tx.in_msg.value;
        const senderAddress = tx.in_msg.source;
        const payload = tx.in_msg.message;

        const existingTransaction = await prisma.transaction.findUnique({
            where: { transaction_id: transactionId }
        });

        if (existingTransaction) {
            console.log(`Transaction with ID ${transactionId} already processed. Skipping.`);
            return;
        }

        const userId = BigInt(payload);
        await prisma.$transaction(async (prismaTransaction) => {
            const user = await prismaTransaction.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                console.log(`User with ID ${userId} not found.`);
                return;
            }

            const updatedUser = await prismaTransaction.user.update({
                where: { id: userId },
                data: {
                    ton: user.ton + parseFloat(TonWeb.utils.fromNano(value)),
                },
            });

            await prismaTransaction.transaction.create({
                data: {
                    transaction_id: transactionId,
                    amount: parseFloat(TonWeb.utils.fromNano(value)),
                    user_id: updatedUser.id,
                },
            });

            console.log(`Successfully processed ${TonWeb.utils.fromNano(value)} TON from ${senderAddress} for user ${userId}`);
        });
    }
};

const accountSubscription = new AccountSubscription(tonweb, MY_WALLET_ADDRESS, 0, onTransaction);
accountSubscription.start();
