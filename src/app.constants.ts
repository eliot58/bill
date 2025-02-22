export class ExpiredError extends Error {
    constructor() {
        super('Init data expired');
        this.name = 'ExpiredError';
    }
}

export class UnexpectedFormatError extends Error {
    constructor() {
        super('Unexpected format');
        this.name = 'UnexpectedFormatError';
    }
}

export class SignMissingError extends Error {
    constructor() {
        super('Missing signature in init data');
        this.name = 'SignMissingError';
    }
}

export class SignInvalidError extends Error {
    constructor() {
        super('Invalid signature in init data');
        this.name = 'SignInvalidError';
    }
}

export const FEE = {
    ton: 0.05,
    not: 20,
    usdt: 0.300
}

export const MIN_WITHDRAW = {
    ton: 3,
    not: 100,
    usdt: 5
}

export const ADDRESS: string = "UQBYwq42_KLe0BIuYHR1fBKbtvoumU9hAKvMuylJHYZCJzFn"