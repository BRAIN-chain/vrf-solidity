// const VRFGasHelper = artifacts.require("VRFGasHelper")
const data = require("../test/data.json")

// describe("VRFGasHelper - Gas consumption analysis", accounts => {
describe("VRF verification functions:", () => {
  let helper
  before(async () => {
    // helper = await VRFGasHelper.new()
    const signer = await ethers.getSigners();
    const Verifier = await ethers.getContractFactory("VRFGasHelper", signer);
    helper = await Verifier.deploy();
    await helper.deployed();
    console.log("VRFGasHelper:", helper.address);
  })

  /* verify() */
  it(`verify()`, async () => {
    let gasUsed = [];

    for (const [index, test] of data.verify.valid.entries()) {
      const publicKey = await helper.decodePoint(test.pub)
      const proof = await helper.decodeProof(test.pi)
      const message = test.message
      await helper.verify(publicKey, proof, message)
      gasUsed.push(await helper.gasUsed())
    }

    let gasUsedFloat = gasUsed.map((e) => {
      return ethers.FixedNumber.fromString(e.toString());
    })

    let sum = new ethers.BigNumber.from(0);
    let minGasUsed = gasUsed[0];
    let maxGasUsed = gasUsed[0];
    let averageGasUsed;
    let sdGasUsed;
    let medianGasUsed;

    // Calculate min, max, and sum
    for (let num of gasUsed) {
      if (num.lt(minGasUsed)) minGasUsed = num;
      if (num.gt(maxGasUsed)) maxGasUsed = num;
      sum = sum.add(num);
    }

    // Calculate average
    averageGasUsed =
      ethers.FixedNumber.fromString(sum.toString())
        .divUnsafe(ethers.FixedNumber.from(gasUsed.length));

    // Calculate standard deviation
    const ONE = ethers.FixedNumber.from(1);
    const TWO = ethers.FixedNumber.from(2);
    function sqrt(value) {
      x = ethers.FixedNumber.from(value);
      let z = x.addUnsafe(ONE).divUnsafe(TWO);
      let y = x;
      while (z.subUnsafe(y).isNegative()) {
        y = z;
        z = x.divUnsafe(z).addUnsafe(z).divUnsafe(TWO);
      }
      return y.divUnsafe(ethers.FixedNumber.from(10 ** 9));
    }

    const varGasUsed = (gasUsedFloat.reduce(
      (p, c) => {
        return p.addUnsafe(
          (c.subUnsafe(averageGasUsed))
            .mulUnsafe(c.subUnsafe(averageGasUsed))
        )
      },
      new ethers.FixedNumber.from(0)
    )).divUnsafe(ethers.FixedNumber.from(gasUsedFloat.length));
    sdGasUsed = sqrt(varGasUsed);

    // Calculate median
    function compareBigNumbers(a, b) {
      if (a.gt(b)) {
        return 1;
      } else if (a.lt(b)) {
        return -1;
      } else {
        return 0;
      }
    }
    gasUsed.sort(compareBigNumbers);
    if (gasUsed.length % 2 === 0) {
      let mid1 = gasUsed[gasUsed.length / 2 - 1];
      let mid2 = gasUsed[gasUsed.length / 2];
      medianGasUsed =
        ethers.FixedNumber.fromString(mid1.toString())
          .addUnsafe(ethers.FixedNumber.fromString(mid2.toString()))
          .divUnsafe(ethers.FixedNumber.from(2));
    } else {
      medianGasUsed = gasUsed[Math.floor(gasUsed.length / 2)];
    }

    // console.log(gasUsed);
    console.log(`Min: ${minGasUsed}`);
    console.log(`Max: ${maxGasUsed}`);
    console.log(`Average (std): ${averageGasUsed} (${sdGasUsed} = sqrt(${varGasUsed}))`);
    console.log(`Median: ${medianGasUsed}`);
  })

  /* fastVerify() */
  it("fastVerify() (1) && fastVerify()", async () => {
    let gasUsed = [];

    for (const test of data.fastVerify.valid) {
      // Standard inputs
      const proof = await helper.decodeProof(test.pi)
      const publicKeyX = test.publicKey.x
      const publicKeyY = test.publicKey.y
      const publicKey = [publicKeyX, publicKeyY]
      const message = test.message
      // VRF fast verify requirements
      // U = s*B - c*Y
      const uPointX = test.uPoint.x
      const uPointY = test.uPoint.y
      // V = s*H - c*Gamma
      // s*H
      const vProof1X = test.vComponents.sH.x
      const vProof1Y = test.vComponents.sH.y
      // c*Gamma
      const vProof2X = test.vComponents.cGamma.x
      const vProof2Y = test.vComponents.cGamma.y
      // Check
      await helper.fastVerify(
        publicKey,
        proof,
        message,
        [uPointX, uPointY],
        [vProof1X, vProof1Y, vProof2X, vProof2Y]
      )
      gasUsed.push(await helper.gasUsed())
    }

    for (const [index, test] of data.verify.valid.entries()) {
      const publicKey = await helper.decodePoint(test.pub)
      const proof = await helper.decodeProof(test.pi)
      const message = test.message
      const params = await helper.computeFastVerifyParams(publicKey, proof, message)
      await helper.fastVerify(
        publicKey,
        proof,
        message,
        params[0],
        params[1]
      )
      gasUsed.push(await helper.gasUsed())
    }

    if (gasUsed.length != 0) {
      let gasUsedFloat = gasUsed.map((e) => {
        return ethers.FixedNumber.fromString(e.toString());
      })

      let sum = new ethers.BigNumber.from(0);
      let minGasUsed = gasUsed[0];
      let maxGasUsed = gasUsed[0];
      let averageGasUsed;
      let sdGasUsed;
      let medianGasUsed;

      // Calculate min, max, and sum
      for (let num of gasUsed) {
        if (num.lt(minGasUsed)) minGasUsed = num;
        if (num.gt(maxGasUsed)) maxGasUsed = num;
        sum = sum.add(num);
      }

      // Calculate average
      averageGasUsed =
        ethers.FixedNumber.fromString(sum.toString())
          .divUnsafe(ethers.FixedNumber.from(gasUsed.length));

      // Calculate standard deviation
      const ONE = ethers.FixedNumber.from(1);
      const TWO = ethers.FixedNumber.from(2);
      function sqrt(value) {
        x = ethers.FixedNumber.from(value);
        let z = x.addUnsafe(ONE).divUnsafe(TWO);
        let y = x;
        while (z.subUnsafe(y).isNegative()) {
          y = z;
          z = x.divUnsafe(z).addUnsafe(z).divUnsafe(TWO);
        }
        return y.divUnsafe(ethers.FixedNumber.from(10 ** 9));
      }

      const varGasUsed = (gasUsedFloat.reduce(
        (p, c) => {
          return p.addUnsafe(
            (c.subUnsafe(averageGasUsed))
              .mulUnsafe(c.subUnsafe(averageGasUsed))
          )
        },
        new ethers.FixedNumber.from(0)
      )).divUnsafe(ethers.FixedNumber.from(gasUsedFloat.length));
      sdGasUsed = sqrt(varGasUsed);

      // Calculate median
      function compareBigNumbers(a, b) {
        if (a.gt(b)) {
          return 1;
        } else if (a.lt(b)) {
          return -1;
        } else {
          return 0;
        }
      }
      gasUsed.sort(compareBigNumbers);
      if (gasUsed.length % 2 === 0) {
        let mid1 = gasUsed[gasUsed.length / 2 - 1];
        let mid2 = gasUsed[gasUsed.length / 2];
        medianGasUsed =
          ethers.FixedNumber.fromString(mid1.toString())
            .addUnsafe(ethers.FixedNumber.fromString(mid2.toString()))
            .divUnsafe(ethers.FixedNumber.from(2));
      } else {
        medianGasUsed = gasUsed[Math.floor(gasUsed.length / 2)];
      }

      // console.log(gasUsed);
      console.log(`Min: ${minGasUsed}`);
      console.log(`Max: ${maxGasUsed}`);
      console.log(`Average (std): ${averageGasUsed} (${sdGasUsed} = sqrt(${varGasUsed}))`);
      console.log(`Median: ${medianGasUsed}`);
    }
  })

  for (const [index, test] of data.verify.valid.entries()) {
    it.skip(`gammaToHash() (${index + 1})`, async () => {
      const proof = await helper.decodeProof(test.pi)
      await helper.gammaToHash(proof[0], proof[1])
    })
  }
})
describe("VRF auxiliary public functions:", () => {
  let helper
  before(async () => {
    // helper = await VRFGasHelper.new()
    const signer = await ethers.getSigners();
    const Verifier = await ethers.getContractFactory("VRFGasHelper", signer);
    helper = await Verifier.deploy();
    await helper.deployed();
    console.log("VRFGasHelper:", helper.address);
  })
  for (const [index, test] of data.proofs.valid.entries()) {
    it.skip(`decodeProof() (${index + 1})`, async () => {
      await helper.decodeProof(test.pi)
    })
  }
  for (const [index, test] of data.points.valid.entries()) {
    it.skip(`decodePoint() (${index + 1})`, async () => {
      await helper.decodePoint(test.compressed)
    })
  }
  for (const [index, test] of data.verify.valid.entries()) {
    it.skip(`computeFastVerifyParams() (${index + 1})`, async () => {
      const publicKey = await helper.decodePoint(test.pub)
      const proof = await helper.decodeProof(test.pi)
      const message = test.message
      await helper.computeFastVerifyParams(publicKey, proof, message)
    })
  }
})
// })
