
export function requiredVerifications(activeSpiders: number) : number {
    const gamma = 0.5772156649015328;                   // Euler–Mascheroni constant
    const f = (c: number) => c * (Math.log(c) + gamma); // Harmonic Series approximation

    let c = 1; while (c < activeSpiders) c <<= 1;
    let e = c >> 1;

    while (e > 0) {
        if (f(c) <= activeSpiders) c += e;
        else c -= e;
        e >>= 1;
    }

    return c;
}

export function requiredBounty(totalBounty: bigint, networkCapacity: number, activeSpiders: number) {
    const rV = BigInt(requiredVerifications(activeSpiders));
    const cap = BigInt(networkCapacity);
    return BigInt(1000) + totalBounty * rV / (cap - rV);
}
