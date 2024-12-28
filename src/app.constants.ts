export class ExpiredError extends Error {
    constructor() {
        super('init data expired');
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

export const DURAK_TOKEN = process.env.DURAK_TOKEN

export const ADDRESS: string = "UQBYwq42_KLe0BIuYHR1fBKbtvoumU9hAKvMuylJHYZCJzFn"