const wait = (millis) => {
    return new Promise(resolve => {
        setTimeout(resolve, millis);
    });
}

export class AccountSubscription {
    constructor(tonweb, accountAddress, startTime, onTransaction) {
        this.tonweb = tonweb;
        this.accountAddress = accountAddress;
        this.startTime = startTime;
        this.onTransaction = onTransaction;
    }

    async start() {
        const getTransactions = async (time, offsetTransactionLT, offsetTransactionHash, retryCount) => {
            const COUNT = 20;

            if (offsetTransactionLT) {
                console.log(`Get ${COUNT} transactions before transaction ${offsetTransactionLT}:${offsetTransactionHash}`);
            } else {
                console.log(`Get last ${COUNT} transactions`);
            }

            let transactions;

            try {
                transactions = await this.tonweb.provider.getTransactions(this.accountAddress, COUNT, offsetTransactionLT, offsetTransactionHash);
            } catch (e) {
                console.error(e);
                retryCount++;
                if (retryCount < 10) {
                    await wait(retryCount * 1000);
                    return getTransactions(time, offsetTransactionLT, offsetTransactionHash, retryCount);
                } else {
                    return 0;
                }
            }

            console.log(`Got ${transactions.length} transactions`);

            if (!transactions.length) {
                return time;
            }

            if (!time) time = transactions[0].utime;

            for (const tx of transactions) {

                if (tx.utime < this.startTime) {
                    return time;
                }

                await this.onTransaction(tx);
            }

            if (transactions.length === 1) {
                return time;
            }

            const lastTx = transactions[transactions.length - 1];
            return await getTransactions(time, lastTx.transaction_id.lt, lastTx.transaction_id.hash, 0);
        }


        let isProcessing = false;

        const tick = async () => {
            if (isProcessing) return;
            isProcessing = true;

            try {
                const result = await getTransactions(undefined, undefined, undefined, 0);
                if (result > 0) {
                    this.startTime = result; 
                }
            } catch (e) {
                console.error(e);
            }

            isProcessing = false;
        }

        setInterval(tick, 10 * 1000);
        tick();
    }
}