import { requiredVerifications, requiredBounty } from '././math';

describe('Test the requiredVerifications function', () => {
    test('A negative number of active spiders require 1 verification', () => {
        expect(requiredVerifications(-1)).toBe(1);
        expect(requiredVerifications(-100)).toBe(1);
    });

    test('0 active spiders require 1 verification', () => {
        expect(requiredVerifications(0)).toBe(1);
    });
    
    test('100 active spiders require 27 verification', () => {
        expect(requiredVerifications(100)).toBe(27);
    });
});

describe('Test the requiredBounty function', () => {
    test('If the network capacity and/or active spiders are 0 or negative, return BigInt(1000)', () => {
        expect(requiredBounty(BigInt(0), 0, 0)).toBe(BigInt(1000));
        expect(requiredBounty(BigInt(0), 1, 0)).toBe(BigInt(1000));
        expect(requiredBounty(BigInt(0), 0, 1)).toBe(BigInt(1000));
        expect(requiredBounty(BigInt(0), -1000, 0)).toBe(BigInt(1000));
        expect(requiredBounty(BigInt(0), 0, -1000)).toBe(BigInt(1000));
    });

    test('If the total bounty equals 0, return BigInt(1000)', () => {
        expect(requiredBounty(BigInt(0), 100, 100)).toBe(BigInt(1000));
    });

    test('If total bounty is 5000, 50 network capacity and 25 spiders, return BigInt(2097)', () => {
        expect(requiredBounty(BigInt(5000), 50, 25)).toBe(BigInt(2097));
    });
});