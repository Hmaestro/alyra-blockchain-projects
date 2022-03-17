//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
 
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    uint public winningProposalId;

    mapping(address => Voter) public whitelist;
    WorkflowStatus public activeStatus;
    mapping (uint => Proposal) public proposals;
    uint proposalIndex;

    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    // Enregistrement d'un votant par l'admin dans la liste blanche
    function registerVoter(address _voterAddress) public onlyOwner {
        require(activeStatus == WorkflowStatus.RegisteringVoters, unicode"L'enregistrement des votants est terminé");
        
        whitelist[_voterAddress] = Voter(true, false, 0);
        emit VoterRegistered(_voterAddress);
    }

    // Démarrer la session d'enregistrement de la proposition
    function startProposalRegistration() public onlyOwner {
        require(activeStatus == WorkflowStatus.RegisteringVoters, unicode"Démarrage de la session d'enregistrement des propositions non autorisé");
        activeStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    // Enregistrer les propositions des électeurs
    function registerProposal(string calldata _proposal) public {
        require(activeStatus == WorkflowStatus.ProposalsRegistrationStarted, unicode"Enregistrement de proposition non autorisé. Voir l'administrateur");
        require(whitelist[msg.sender].isRegistered, unicode"Interdit: Utilisateur non enregistré");
        proposalIndex++;

        //FIXME Doublon de proposition
        proposals[proposalIndex] = Proposal({description: _proposal, voteCount:0});
        emit ProposalRegistered(proposalIndex);             
    }

}