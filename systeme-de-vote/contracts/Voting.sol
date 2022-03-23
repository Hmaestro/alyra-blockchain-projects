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

    mapping(address => Voter) public voters;
    WorkflowStatus public activeStatus;
    Proposal[] public proposals;
    uint private proposalIndex;
  

    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

    modifier onlyRegistered() {
        require(voters[msg.sender].isRegistered, unicode"Interdit: Utilisateur non enregistré");
        _;
    }

    modifier onlyProposalRegistrationActive() {
        require(activeStatus == WorkflowStatus.ProposalsRegistrationStarted, unicode"Session d'enregistrement des propostions inactive");
        _;
    }

    modifier onlyRegisteringVotersActive() {
        require(activeStatus == WorkflowStatus.RegisteringVoters, unicode"Session d'enregistrement des votants inactive");
        _;
    }

    modifier onlyVotingSessionStarted() {
        require(activeStatus == WorkflowStatus.VotingSessionStarted, unicode"La session de vote n'est pas démarrée");
        _;
    }

    // Enregistrement d'un votant par l'admin dans la liste blanche
    function registerVoter(address _voterAddress) external onlyOwner onlyRegisteringVotersActive {        
        // Vérifier si l'électeur n'est pas déjà enregistré
        require(!voters[_voterAddress].isRegistered, unicode"Electeur déjà enregistré");
        voters[_voterAddress] = Voter(true, false, 0);
        emit VoterRegistered(_voterAddress);
    }

    // Démarrer la session d'enregistrement de la proposition
    function startProposalRegistration() external onlyOwner onlyRegisteringVotersActive {       
        activeStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    // Enregistrer les propositions des électeurs
    function registerProposal(string calldata _proposal) external onlyRegistered onlyProposalRegistrationActive {        
        require(isNewProposal(_proposal), unicode"Proposition déjà enregistrée");
        
        proposals.push( Proposal({description: _proposal, voteCount:0}) );
        emit ProposalRegistered(proposalIndex);
        proposalIndex++;             
    }

    // Arret de la session d'enregistrement des propositions
    function stopProposalRegistration() external onlyOwner onlyProposalRegistrationActive {
        activeStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    // Demarrer la session de vote
    function startVotingSession() external onlyOwner {
        require(activeStatus == WorkflowStatus.ProposalsRegistrationEnded, unicode"Session d'enregistrement des propositions inactive");

        activeStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    // Les électeurs inscrits votent pour leurs propositions préférées
    function voting(uint _proposalId) external onlyRegistered onlyVotingSessionStarted {
        require(!voters[msg.sender].hasVoted, unicode"Vous avez déjà voté !!!");
        // vérifier que la proposition existe
        require(isProposalExist(_proposalId), unicode"Cette proposition n'existe pas. Faites un autre choix");

        voters[msg.sender].votedProposalId = _proposalId;
        voters[msg.sender].hasVoted = true;
        proposals[_proposalId].voteCount++;
        emit Voted (msg.sender, _proposalId);
    }

    // Fin de la session de vote
    function stopVotingSession() external onlyOwner onlyVotingSessionStarted {
        activeStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    function computeResult() external onlyOwner {
        require(activeStatus == WorkflowStatus.VotingSessionEnded, unicode"La session de vote n'est pas terminée");
         
        for (uint proposalId = 0; proposalId < proposals.length; proposalId++) {
            winningProposalId = ( proposals[proposalId].voteCount > proposals[winningProposalId].voteCount ) ? proposalId : winningProposalId;
        }
        activeStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    function isProposalExist(uint _proposalId) private view returns (bool) {
        return ( bytes(proposals[_proposalId].description) ).length > 0;
    }

    function isNewProposal(string calldata _proposalDescription) private view returns(bool) {

        for(uint proposalId = 0; proposalId < proposals.length; proposalId++) {
            if ( keccak256(abi.encodePacked( proposals[proposalId].description) ) == keccak256(abi.encodePacked(_proposalDescription)) ) {
                return false;
            }
        }
        return true;
    }

    function getWinner() external view returns(string memory description, uint voteCount) {
        require(activeStatus == WorkflowStatus.VotesTallied, unicode"Le résultat n'est pas encore disponible");
        return (proposals[winningProposalId].description, proposals[winningProposalId].voteCount);
    }

}