
// export function findRootN(
//     x: number,
//     f: (x: number) => number,
//     df: (x: number) => number): number {

//     for (let i = 0; i < 10000; i++) {
//         const x_prev = x;
//         x = x - f(x) / df(x);
//         if (x == x_prev) {
//             console.warn("Root finding took " + i + " iterations");
//             return x;
//         }
//     }

//     console.warn("Could not find root");

//     return x;
// }

// // export function findRootB(a: number, b: number, f: (x:number) => number): number {

// //     if (a == b) return a;

// //     const m = (a + b) / 2;
// //     const fm = f(m);

// //     switch (Math.sign(fm)) {
// //         case -1: return findRootB(m, b, f);
// //         case 0: return m;
// //         case 1: return findRootB(a, m, f);
// //         default: throw new Error("Invalid sign");
// //     }

// //     do {

// //     } while (m != )
// // }

// export function powerlog(p: number) : number {
//     const f = (x: number) => x * Math.exp(x) - p;

//     let x = 1; while (x < p) x <<= 1;
//     let o = x >> 1;

//     while (o > 0) {
//         if (f(x) <= 0) x += o;
//         else x -= o;
//         o >>= 1;
//     }

//     return x;
// }

export function requiredVerifications(activeSpiders: number) : number {
    const gamma = 0.577;
    const f = (c: number) => c * (Math.log(c) + gamma);

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
