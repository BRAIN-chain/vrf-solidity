// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./libraries/VRF.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VRFOracle is Ownable {
    uint256[2] private _publicKey;

    uint256 private constant SET_REQUEST = type(uint256).max - 1;
    uint256 public requestId;
    mapping(uint256 => uint256) public random;

    event RandomnessRequest(uint256 requestId);
    event RandomnessRequestFulfilled(uint256 requestId, uint256 randomness);

    constructor(bytes memory publicKey) Ownable(msg.sender) {
        setPublicKey(publicKey);
    }

    function setPublicKey(bytes memory publicKey) public onlyOwner {
        _publicKey = VRF.decodePoint(publicKey);
    }

    function getPublicKey() public view returns (bytes memory) {
        return VRF.encodePoint(_publicKey[0], _publicKey[1]);
    }

    function decodeProof(
        bytes memory _proof
    ) public pure returns (uint256[4] memory) {
        return VRF.decodeProof(_proof);
    }

    function decodePoint(
        bytes memory _point
    ) public pure returns (uint256[2] memory) {
        return VRF.decodePoint(_point);
    }

    function computeFastVerifyParams(
        uint256[4] memory proof,
        bytes memory message
    ) public view returns (uint256[2] memory, uint256[4] memory) {
        return VRF.computeFastVerifyParams(_publicKey, proof, message);
    }

    function verify(
        uint256[4] memory proof,
        bytes memory message
    ) public view returns (bool) {
        return VRF.verify(_publicKey, proof, message);
    }

    function fastVerify(
        uint256[4] memory proof,
        bytes memory message,
        uint256[2] memory uPoint,
        uint256[4] memory vComponents
    ) public view returns (bool) {
        return VRF.fastVerify(_publicKey, proof, message, uPoint, vComponents);
    }

    function gammaToHash(
        uint256 _gammaX,
        uint256 _gammaY
    ) public pure returns (bytes32) {
        return VRF.gammaToHash(_gammaX, _gammaY);
    }

    function reqRandomness() external {
        random[requestId] = SET_REQUEST;
        emit RandomnessRequest(requestId++);
    }

    function resRandomness(
        uint256 rid,
        uint256[4] memory proof,
        bytes memory message,
        uint256[2] memory uPoint,
        uint256[4] memory vComponents
    ) external onlyOwner {
        require(random[rid] == SET_REQUEST, "Invalid rid.");
        uint256 randomness = uint256(keccak256(message));
        random[rid] = randomness;
        bool isValid = fastVerify(proof, message, uPoint, vComponents);
        require(isValid, "Invalid randomness.");
        emit RandomnessRequestFulfilled(rid, randomness);
    }
}
