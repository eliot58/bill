import TonWeb from "tonweb";
import {AccountSubscription} from "./account/AccountSubscription.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'))

const MY_WALLET_ADDRESS = 'UQBYwq42_KLe0BIuYHR1fBKbtvoumU9hAKvMuylJHYZCJzFn';

const JETTONS_INFO = {
    'USDT': {
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        decimals: 6
    },
    'NOT': {
        address: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
        decimals: 9
    }
}

const jettons = {};

const prepare = async () => {
    for (const name in JETTONS_INFO) {
        const info = JETTONS_INFO[name];
        const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {
            address: info.address
        });
        const jettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(MY_WALLET_ADDRESS));
        console.log('My jetton wallet for ' + name + ' is ' + jettonWalletAddress.toString(true, true, true));
        const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
            address: jettonWalletAddress
        });

        const jettonData = await jettonWallet.getData();
        if (jettonData.jettonMinterAddress.toString(false) !== new TonWeb.utils.Address(info.address).toString(false)) {
            throw new Error('jetton minter address from jetton wallet doesnt match config');
        }

        jettons[name] = {
            jettonMinter: jettonMinter,
            jettonWalletAddress: jettonWalletAddress,
            jettonWallet: jettonWallet
        };
    }
}

const jettonWalletAddressToJettonName = (jettonWalletAddress) => {
    const jettonWalletAddressString = new TonWeb.utils.Address(jettonWalletAddress).toString(false);
    for (const name in jettons) {
        const jetton = jettons[name];
        if (jetton.jettonWalletAddress.toString(false) === jettonWalletAddressString) {
            return name;
        }
    }
    return null;
}

function parsePayload(payload) {
    let payloadBytes = [];
    while (payload) {
        payloadBytes = [...payloadBytes, ...payload.loadBits(payload.getFreeBits())];
        payload = payload.loadRef();
    }
    return new TextDecoder().decode(new Uint8Array(payloadBytes));
}


const init = async () => {
    await prepare();

    const onTransaction = async (tx) => {
        const sourceAddress = tx.in_msg.source;
        if (!sourceAddress) {
            return;
        }
        const jettonName = jettonWalletAddressToJettonName(sourceAddress);
        if (!jettonName) {
            return;
        }

        if (!tx.in_msg.msg_data ||
            tx.in_msg.msg_data['@type'] !== 'msg.dataRaw' ||
            !tx.in_msg.msg_data.body
        ) {
            return;
        }

        const msgBody = TonWeb.utils.base64ToBytes(tx.in_msg.msg_data.body);
        const transactionId = tx.transaction_id.lt + ':' + tx.transaction_id.hash;

        const existingTransaction = await prisma.transaction.findUnique({
            where: { transaction_id: transactionId }
        });

        if (existingTransaction) {
            console.log(`Transaction with ID ${transactionId} already processed. Skipping.`);
            return;
        }

        const cell = TonWeb.boc.Cell.oneFromBoc(msgBody);
        const slice = cell.beginParse();
        const op = slice.loadUint(32);
        if (!op.eq(new TonWeb.utils.BN(0x7362d09c))) return;
        const queryId = slice.loadUint(64);
        const amount = slice.loadCoins();
        const from = slice.loadAddress();
        const maybeRef = slice.loadBit();
        const payload = maybeRef ? slice.loadRef() : slice;
        const payloadOp = payload.loadUint(32);
        if (!payloadOp.eq(new TonWeb.utils.BN(0))) {
            console.log('no text comment in transfer_notification');
            return;
        }

        const userId = BigInt(parsePayload(payload));

        if (jettonName == "USDT") {
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
                        usdt: user.usdt + amount / Math.pow(10, JETTONS_INFO.USDT.decimals),
                    },
                });
    
                await prismaTransaction.transaction.create({
                    data: {
                        transaction_id: transactionId,
                        amount: amount / Math.pow(10, JETTONS_INFO.USDT.decimals),
                        user_id: updatedUser.id,
                    },
                });
    
            });
        } else if (jettonName == "NOT") {
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
                        not: user.not + amount / Math.pow(10, JETTONS_INFO.NOT.decimals),
                    },
                });
    
                await prismaTransaction.transaction.create({
                    data: {
                        transaction_id: transactionId,
                        amount: amount / Math.pow(10, JETTONS_INFO.NOT.decimals),
                        user_id: updatedUser.id,
                    },
                });
    
            });
        }
        console.log('Got ' + jettonName + ' jetton deposit ' + amount.toString() + ' units with text comment "' + userId + '"');
    }

    const accountSubscription = new AccountSubscription(tonweb, MY_WALLET_ADDRESS, 0, onTransaction);
    await accountSubscription.start();
}

init();