# TL;DR

```bash
$ npx hardhat test benchmark/gas.js --network hardhat

Min: 1516826
Max: 1831436
Average (std): 1616299.717391304347826086 (62481.573940421077057338 = sqrt(3903947082.072306238185255197))
Median: 1610665.5
    ✔ verify() (41068ms)

Min: 74484
Max: 316627
Average (std): 118130.957446808510638297 (54104.693868406037833132 = sqrt(2927317898.593933906745133544))
Median: 110352
    ✔ fastVerify() (1) && fastVerify() (41648ms)
```

---

# vrf-solidity [![npm version](https://badge.fury.io/js/vrf-solidity.svg)](https://badge.fury.io/js/vrf-solidity) [![TravisCI](https://travis-ci.com/witnet/vrf-solidity.svg?branch=master)](https://travis-ci.com/witnet/vrf-solidity)

`vrf-solidity` is an open source fast and effective implementation of Verifiable Random Functions (VRFs) written in Solidity. More precisely, this library implements verification functions for VRF proofs based on the Elliptic Curve (EC) `Secp256k1`.

_DISCLAIMER: This is experimental software. **Use it at your own risk**!_

The solidity library has been designed aiming at decreasing gas consumption and its complexity due to EC operations.

It provides two main `pure` functions for verifying VRF proofs:

- **verify**:
  - _Description_: VRF *full* verification (requires heavy EC computation)
  - _Inputs_:
    - *_publicKey*: The public key as an array composed of `[pubKey-x, pubKey-y]`
    - *_proof*: The VRF proof as an array composed of `[gamma-x, gamma-y, c, s]`
    - *_message*: The message (in bytes) used for computing the VRF
  - _Output_:
    - true, if VRF proof is valid
- **fastVerify**:
  - _Description_: VRF *fast* verification by providing additional EC points. It uses the `ecrecover` precompiled function to verify EC multiplications (lower gas consumption).
  - _Inputs_:
    - *_publicKey*: The public key as an array composed of `[pubKey-x, pubKey-y]`
    - *_proof*: The VRF proof as an array composed of `[gamma-x, gamma-y, c, s]`
    - *_message*: The message (in bytes) used for computing the VRF
    - *_uPoint*: The `u` EC point defined as `U = s*B - c*Y`
    - *_vComponents*: The components required to compute `v` as `V = s*H - c*Gamma`
  - _Output_:
    - true, if VRF proof is valid

Additionally, the library provides some auxiliary `pure` functions to facilitate computing the aforementioned input parameters:

- **decodeProof**:
  - _Description_: Decode from bytes to VRF proof
  - _Input_:
    - *_proof*: The VRF proof as bytes
  - _Output_:
    - The VRF proof as an array composed of `[gamma-x, gamma-y, c, s]`
- **decodePoint**:
  - _Description_: Decode from bytes to EC point
  - _Input_:
    - *_point*: The EC point as bytes
  - _Output_:
    - The point as `[point-x, point-y]`
- **computeFastVerifyParams**:
  - _Description_: Compute the parameters (EC points) required for the VRF fast verification function
  - _Inputs_:
    - *_publicKey*: The public key as an array composed of `[pubKey-x, pubKey-y]`
    - *_proof*: The VRF proof as an array composed of `[gamma-x, gamma-y, c, s]`
    - *_message*: The message (in bytes) used for computing the VRF
  - _Output_:
    - The fast verify required parameters as the tuple `([uPointX, uPointY], [sHX, sHY, cGammaX, cGammaY])`
- **gammaToHash**:
  - _Description_: Computes the VRF hash output as result of the digest of a ciphersuite-dependent prefix concatenated with the gamma point. This hash can be used for deterministically generating verifiable pseudorandom numbers.
  - _Inputs_:
    - *_gammaX*: The x-coordinate of the gamma EC point
    - *_gammaY*: The y-coordinate of the gamma EC point
  - _Output_:
    - The VRF hash ouput as shas256 digest

## Elliptic Curve VRF (using `Secp256k1`)

This library follows the algorithms described in [VRF-draft-04](https://tools.ietf.org/pdf/draft-irtf-cfrg-vrf-04) in order to provide the VRF verification capability.

The supported cipher suite is `SECP256K1_SHA256_TAI`, i.e. the aforementioned algorithms using `SHA256` as digest function and the `secp256k1` curve. For the VRF algorithms the cipher suite code used is `0xFE`.

For elliptic curve arithmetic operations `vrf-solidity` uses the `elliptic-curve-solidity` library.

## Usage

`VRF.sol` library can be used directly by importing it.

Similarly to the [`VRFTestHelper.sol`](https://github.com/witnet/vrf-solidity/blob/master/test/VRFTestHelper.sol) from the [`test`][test-folder] project folder, a contract may use the library by instantiation as follows:

```solidity
pragma solidity 0.6.12;

import "vrf-solidity/contracts/VRF.sol";


contract VRFTestHelper {

  function functionUsingVRF(
    uint256[2] memory public _publicKey,
    uint256[4] memory public _proof,
    bytes memory _message)
  public returns (bool)
  {
    return VRF.verify(_publicKey, _proof, _message);
  }
}
```

The tests under the [`test`][test-folder] folder can be seen as additional examples for interacting with the contract using Solidity and Javascript.

## Benchmark (Updated at Jan 13, 2023)

Gas consumption analysis was conducted in order to understand the associated costs to the usage of the `vrf-solidity` library. Only `public` functions were object of study as they are the only functions meant to be called by other parties.

The three auxiliary public functions (`decodeProof`, `decodePoint` and `computeFastVerifyParams`) are recommended to be used (if possible) as off-chain operations.

### How to Run

- solc version: 0.6.12+commit.27d51765
- optimizer enabled: true (runs 200)

```bash
$ nvm use 12

$ ganache-cli -b 5
```
```bash
$ nvm use 12

$ truffle test --network local ./benchmark/VRFGasHelper.sol ./benchmark/gas.js

  Contract: VRFGasHelper - Gas consumption analysis
    VRF verification functions:
      ✓ should verify a VRF proof (1) (1615119 gas)
      ✓ should verify a VRF proof (2) (1706587 gas)
      ...
```

```
·--------------------------------------------|---------------------------|-------------|----------------------------·
|    Solc version: 0.6.12+commit.27d51765    ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 6718946 gas  │
·············································|···························|·············|·····························
|  Methods                                                                                                          │
·················|···························|·············|·············|·············|··············|··············
|  Contract      ·  Method                   ·  Min        ·  Max        ·  Avg        ·  # calls     ·  usd (avg)  │
·················|···························|·············|·············|·············|··············|··············
|  VRFGasHelper  ·  computeFastVerifyParams  ·    1513058  ·    1831274  ·    1611989  ·          91  ·          -  │
·················|···························|·············|·············|·············|··············|··············
|  VRFGasHelper  ·  decodePoint              ·      55844  ·      55877  ·      55867  ·          10  ·          -  │
·················|···························|·············|·············|·············|··············|··············
|  VRFGasHelper  ·  decodeProof              ·      56839  ·      56860  ·      56851  ·          10  ·          -  │
·················|···························|·············|·············|·············|··············|··············
|  VRFGasHelper  ·  fastVerify               ·     106360  ·     352838  ·     150715  ·          94  ·          -  │
·················|···························|·············|·············|·············|··············|··············
|  VRFGasHelper  ·  gammaToHash              ·      24189  ·      24201  ·      24198  ·          91  ·          -  │
·················|···························|·············|·············|·············|··············|··············
|  VRFGasHelper  ·  verify                   ·    1543493  ·    1862450  ·    1643712  ·          92  ·          -  │
·················|···························|·············|·············|·············|··············|··············
|  Deployments                               ·                                         ·  % of limit  ·             │
·············································|·············|·············|·············|··············|··············
|  VRFGasHelper                              ·          -  ·          -  ·    1598637  ·      23.8 %  ·          -  │
·--------------------------------------------|-------------|-------------|-------------|--------------|-------------·

  195 passing (20m)
```

In Ethereum, gas consumption derived from [Etherscan](https://etherscan.io/gastracker) Average. USD price estimation derived from [CoinMarketCap](https://coinmarketcap.com/currencies/ethereum/).

- 14 gwei/gas
- 1412.49 usd/eth

```
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
|  Contract      ·  Method                   ·  Min        ·  Max        ·  Avg        ·  # calls     ·  usd (avg)  │
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
|  VRF           ·  verify                   ·    1543493  ·    1862450  ·    1643712  ·          92  ·      32.50  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  fastVerify               ·     106360  ·     352838  ·     150715  ·          94  ·       2.98  │
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
```

```
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
|  Contract      ·  Method                   ·  Min        ·  Max        ·  Avg        ·  # calls     ·  usd (avg)  │
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
|  VRF           ·  decodeProof              ·      56839  ·      56860  ·      56851  ·          10  ·       1.12  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  decodePoint              ·      55844  ·      55877  ·      55867  ·          10  ·       1.10  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  computeFastVerifyParams  ·    1513058  ·    1831274  ·    1611989  ·          91  ·      31.88  │
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
```

In Polygon, gas consumption derived from [Polygonscan](https://polygonscan.com/gastracker) Average. USD price estimation derived from [CoinMarketCap](https://coinmarketcap.com/currencies/polygon/).

- 51.6 gwei/gas
- 0.91 usd/matic

```
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
|  Contract      ·  Method                   ·  Min        ·  Max        ·  Avg        ·  # calls     ·  usd (avg)  │
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
|  VRF           ·  verify                   ·    1543493  ·    1862450  ·    1643712  ·          92  ·     0.0772  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  fastVerify               ·     106360  ·     352838  ·     150715  ·          94  ·     0.0071  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  decodeProof              ·      56839  ·      56860  ·      56851  ·          10  ·     0.0027  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  decodePoint              ·      55844  ·      55877  ·      55867  ·          10  ·     0.0026  │
·················|···························|·············|·············|·············|··············|··············
|  VRF           ·  computeFastVerifyParams  ·    1513058  ·    1831274  ·    1611989  ·          91  ·     0.0757  │
·----------------|---------------------------|-------------|-------------|-------------|--------------|-------------·
```

## Test Vectors

The following resources have been used for test vectors:

- `Secp256k1`: [Chuck Batson](https://chuckbatson.wordpress.com/2014/11/26/secp256k1-test-vectors/)
- VRF with ciphersuite `SECP256K1_SHA256_TAI`: [vrf-rs](https://github.com/witnet/vrf-rs/)

## Acknowledgements

Some EC arithmetic operations have been opmitized thanks to the impressive work of the following resources:

- Post by Vitalik Buterin in [Ethresearch](https://ethresear.ch/t/you-can-kinda-abuse-ecrecover-to-do-ecmul-in-secp256k1-today/2384/9)
- [SolCrypto library](https://github.com/HarryR/solcrypto)

## License

`vrf-solidity` is published under the [MIT license][license].

[license]: https://github.com/witnet/vrf-rs/blob/master/LICENSE
[test-folder]: https://github.com/witnet/vrf-solidity/blob/master/test
