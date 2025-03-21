// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SecHealth {
    struct HealthRecord {
        string encryptedData;
        address owner;
        bool emergencyAccess;
    }

    mapping(address => HealthRecord[]) private records;
    mapping(address => mapping(address => bool)) private accessPermissions;
    mapping(address => bool) private verifiedDoctors;
    address public admin;

    event RecordStored(address indexed patient, uint256 recordIndex);
    event AccessGranted(address indexed patient, address doctor);
    event AccessRevoked(address indexed patient, address doctor);
    event EmergencyAccessUsed(address indexed doctor, address patient);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyOwner(address _patient, uint256 _index) {
        require(records[_patient][_index].owner == msg.sender, "Unauthorized access");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function storeRecord(string memory _encryptedData) external {
        records[msg.sender].push(HealthRecord(_encryptedData, msg.sender, false));
        emit RecordStored(msg.sender, records[msg.sender].length - 1);
    }

    function grantAccess(address _doctor) external {
        require(verifiedDoctors[_doctor], "Doctor not verified");
        accessPermissions[msg.sender][_doctor] = true;
        emit AccessGranted(msg.sender, _doctor);
    }

    function revokeAccess(address _doctor) external {
        require(accessPermissions[msg.sender][_doctor], "No access found");
        accessPermissions[msg.sender][_doctor] = false;
        emit AccessRevoked(msg.sender, _doctor);
    }

    function verifyDoctor(address _doctor) external onlyAdmin {
        verifiedDoctors[_doctor] = true;
    }

    function getRecord(address _patient, uint256 _index) external view returns (string memory) {
        require(accessPermissions[_patient][msg.sender], "Access denied");
        return records[_patient][_index].encryptedData;
    }

    function emergencyAccess(address _patient, uint256 _index) external {
        require(verifiedDoctors[msg.sender], "Doctor not verified");
        records[_patient][_index].emergencyAccess = true;
        emit EmergencyAccessUsed(msg.sender, _patient);
    }
}
