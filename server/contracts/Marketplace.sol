// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MarketplaceContractRegistry {
    uint256 private contractCount;

    struct Milestone {
        uint256 id;
        string title;
        uint256 amount;
        bool released;
    }

    struct ContractDetails {
        uint256 id;
        string projectId;
        uint256 totalAmount;
        uint256 milestoneCount;
    }

    mapping(uint256 => ContractDetails) private contracts;
    mapping(uint256 => mapping(uint256 => Milestone)) private contractMilestones;

    event ContractCreated(uint256 indexed contractId, string projectId, uint256 totalAmount, uint256 milestoneCount);
    event MilestoneReleased(uint256 indexed contractId, uint256 indexed milestoneId, string title, uint256 amount);

    function registerContract(
        string calldata projectId,
        uint256 totalAmount,
        string[] calldata milestoneTitles,
        uint256[] calldata milestoneAmounts
    ) external returns (uint256) {
        require(bytes(projectId).length > 0, 'Project ID required');
        require(milestoneTitles.length == milestoneAmounts.length, 'Milestone arrays must match');

        uint256 newContractId = contractCount + 1;
        contractCount = newContractId;

        contracts[newContractId] = ContractDetails({
            id: newContractId,
            projectId: projectId,
            totalAmount: totalAmount,
            milestoneCount: milestoneTitles.length
        });

        for (uint256 i = 0; i < milestoneTitles.length; i++) {
            contractMilestones[newContractId][i] = Milestone({
                id: i,
                title: milestoneTitles[i],
                amount: milestoneAmounts[i],
                released: false
            });
        }

        emit ContractCreated(newContractId, projectId, totalAmount, milestoneTitles.length);
        return newContractId;
    }

    function registerMilestone(uint256 contractId, string calldata title, uint256 amount) external returns (uint256) {
        require(contractId > 0 && contractId <= contractCount, 'Contract not found');
        require(bytes(title).length > 0, 'Title required');

        uint256 milestoneIndex = contracts[contractId].milestoneCount;
        contractMilestones[contractId][milestoneIndex] = Milestone({
            id: milestoneIndex,
            title: title,
            amount: amount,
            released: false
        });
        contracts[contractId].milestoneCount = milestoneIndex + 1;

        return milestoneIndex;
    }

    function releaseMilestone(uint256 contractId, uint256 milestoneIndex) external returns (bool) {
        require(contractId > 0 && contractId <= contractCount, 'Contract not found');
        require(milestoneIndex < contracts[contractId].milestoneCount, 'Milestone not found');

        Milestone storage milestone = contractMilestones[contractId][milestoneIndex];
        require(!milestone.released, 'Milestone already released');

        milestone.released = true;
        emit MilestoneReleased(contractId, milestone.id, milestone.title, milestone.amount);
        return true;
    }

    function getContract(uint256 contractId) external view returns (string memory projectId, uint256 totalAmount, uint256 milestoneCount) {
        require(contractId > 0 && contractId <= contractCount, 'Contract not found');
        ContractDetails storage details = contracts[contractId];
        return (details.projectId, details.totalAmount, details.milestoneCount);
    }

    function getMilestone(uint256 contractId, uint256 milestoneIndex) external view returns (uint256 id, string memory title, uint256 amount, bool released) {
        require(contractId > 0 && contractId <= contractCount, 'Contract not found');
        require(milestoneIndex < contracts[contractId].milestoneCount, 'Milestone not found');
        Milestone storage milestone = contractMilestones[contractId][milestoneIndex];
        return (milestone.id, milestone.title, milestone.amount, milestone.released);
    }

    function getContractCount() external view returns (uint256) {
        return contractCount;
    }
}
