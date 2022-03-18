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
    address[] voters;

    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    modifier onlyRegistered() {
        require(whitelist[msg.sender].isRegistered, unicode"Interdit: Utilisateur non enregistré");
        _;
    }

    // Enregistrement d'un votant par l'admin dans la liste blanche
    function registerVoter(address _voterAddress) public onlyOwner {
        require(activeStatus == WorkflowStatus.RegisteringVoters, unicode"L'enregistrement des votants est terminé");
        
        whitelist[_voterAddress] = Voter(true, false, 0);
        voters.push(_voterAddress);
        emit VoterRegistered(_voterAddress);
    }

    // Démarrer la session d'enregistrement de la proposition
    function startProposalRegistration() public onlyOwner {
        require(activeStatus == WorkflowStatus.RegisteringVoters, unicode"Démarrage de la session d'enregistrement des propositions non autorisé");
        
        activeStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    // Enregistrer les propositions des électeurs
    function registerProposal(string calldata _proposal) public onlyRegistered {
        require(activeStatus == WorkflowStatus.ProposalsRegistrationStarted, unicode"Enregistrement de proposition non autorisé. Voir l'administrateur");
      
        proposalIndex++;

        //FIXME Doublon de proposition
        proposals[proposalIndex] = Proposal({description: _proposal, voteCount:0});
        emit ProposalRegistered(proposalIndex);             
    }

    // Arret de la session d'enregistrement des propositions
    function stopProposalRegistration() public onlyOwner {
        require(activeStatus == WorkflowStatus.ProposalsRegistrationStarted, unicode"La session d'enregistrement des Propositions doit être démarré avant de l'arrêter");
        
        activeStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    // Demarrer la session de vote
    function startVotingSeesion() public onlyOwner {
        require(activeStatus == WorkflowStatus.ProposalsRegistrationEnded, unicode"La session de vote peut seulement être démarrée après l'arrêt de la session de propsition");

        activeStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    // Les électeurs inscrits votent pour leurs propositions préférées
    function voting(uint _proposalId) public onlyRegistered {
        require(activeStatus == WorkflowStatus.VotingSessionStarted, unicode"La session de vote n'est pas encore démarrée.");
        require(!whitelist[msg.sender].hasVoted, unicode"Euh... Vous avez déjà voté !!!");

        whitelist[msg.sender].votedProposalId = _proposalId;
        whitelist[msg.sender].hasVoted = true;
        emit Voted (msg.sender, _proposalId);
    }

    // Fin de la session de vote
    function stopVotingSession() public onlyOwner {
        require(activeStatus == WorkflowStatus.VotingSessionStarted, unicode"La session de vote n'est pas démarrée");
        activeStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    function computeResult() public onlyOwner {
        require(activeStatus == WorkflowStatus.VotingSessionEnded, unicode"La session de vote n'est pas terminée");

        // FIXME Comptage des votes
        for (uint i = 0; i < voters.length; i++) {
            whitelist[ voters[i] ].votedProposalId;
        }
    }

}