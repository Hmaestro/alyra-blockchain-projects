//const { from } = require("form-data");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { unspecified } = require('@openzeppelin/test-helpers/src/expectRevert');
const { expect } = require('chai');

const Voting = artifacts.require("Voting");

contract("Voting", function ( accounts ) {
  const admin = accounts[0];
  const registeredUser_1 = accounts[1];
  const registeredUser_2 = accounts[2];
  const registeredUser_3 = accounts[3];
  const registeredUser_4 = accounts[4];
  const unregisteredUser = accounts[5];
  
  let votingInstance;

  describe("Tests de l'enregistrement des electeurs", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
    });

    it("should revert registering voter", async () => {
      await expectRevert(votingInstance.addVoter(unregisteredUser, {from: registeredUser_2}), 'caller is not the owner');
    })

    it("should have WorkflowStatus.RegisteringVoters", async() => {
      const status = await votingInstance.workflowStatus();
      //console.log(Voting.WorkflowStatus);
      expect(status.toString()).to.equal(Voting.WorkflowStatus.RegisteringVoters.toString());
    });

    it("should register voters", async() => {      
      const adminRegistered = await votingInstance.addVoter(admin, {from: admin});
      const voter0 = await votingInstance.getVoter(admin);
      assert.isTrue(voter0.isRegistered);
      expectEvent(adminRegistered, 'VoterRegistered', {voterAddress: admin});

      const voter1Registered = await votingInstance.addVoter(registeredUser_1, {from: admin});
      const voter1 = await votingInstance.getVoter(registeredUser_1)
      assert.isTrue(voter1.isRegistered);
      expectEvent(voter1Registered, 'VoterRegistered', {voterAddress: registeredUser_1});
    });
  });

  describe("Test du démarrage de la session d'enregitrement des propositions", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
    });

    it("should revert start Proposals Registering", async () => {
      await expectRevert(votingInstance.startProposalsRegistering({from: registeredUser_2}), 'caller is not the owner');
    })

    it("should start Proposals Registering", async() => {
      const beforeStatus = await votingInstance.workflowStatus();
      expect(beforeStatus.toString()).to.equal(Voting.WorkflowStatus.RegisteringVoters.toString());      

      const event = await votingInstance.startProposalsRegistering({from: admin});

      const afterStatus = await votingInstance.workflowStatus();      
      expect(afterStatus.toString()).to.equal(Voting.WorkflowStatus.ProposalsRegistrationStarted.toString());
      expectEvent(event, 'WorkflowStatusChange', {previousStatus: beforeStatus.toString(), newStatus: afterStatus.toString()});
    });
  });

  describe("Test de l'enregistrement des propositions", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});

      await initVoters();

      await votingInstance.startProposalsRegistering({from: admin});
    });

    it("should have WorkflowStatus.ProposalsRegistrationStarted", async() => {
      const status = await votingInstance.workflowStatus();
      expect(status.toString()).to.equal(Voting.WorkflowStatus.ProposalsRegistrationStarted.toString());
    });

    it("should revert, Not a voter", async () => {
      await expectRevert(votingInstance.addProposal('prop', {from: unregisteredUser}), 'You\'re not a voter');
    });

    it("should revert, Vous ne pouvez pas ne rien proposer", async() => {
      await expectRevert(votingInstance.addProposal('', {from: admin}), 'Vous ne pouvez pas ne rien proposer');
    });

    it('should register proposal', async() => {
      const proposal_0_Registered = await votingInstance.addProposal('proposition 0', {from: registeredUser_1});
      expectEvent(proposal_0_Registered, 'ProposalRegistered', {proposalId: new BN(0)});
      const proposal_0 = await votingInstance.getOneProposal(new BN(0));
      expect(proposal_0.description).equal('proposition 0');

      const proposal_1_Registered = await votingInstance.addProposal('proposition 1', {from: registeredUser_2});
      expectEvent(proposal_1_Registered, 'ProposalRegistered', {proposalId: new BN(1)});
      const proposal_1 = await votingInstance.getOneProposal(new BN(1));
      expect(proposal_1.description).equal('proposition 1');
    });    
  });

  describe("Test de l'arrêt de l'enregistrement des propositions", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
      await votingInstance.startProposalsRegistering({from: admin});      
    });

    it("should revert endProposalsRegistering", async () => {
      await expectRevert(votingInstance.endProposalsRegistering({from: registeredUser_2}), 'caller is not the owner');
    })

    it("should end ProposalsRegistering", async() => {
      const beforeStatus = await votingInstance.workflowStatus();
      expect(beforeStatus.toString()).to.equal(Voting.WorkflowStatus.ProposalsRegistrationStarted.toString());      
      
      const event = await votingInstance.endProposalsRegistering({from: admin});
      
      const afterStatus = await votingInstance.workflowStatus();      
      expect(afterStatus.toString()).to.equal(Voting.WorkflowStatus.ProposalsRegistrationEnded.toString());
      expectEvent(event, 'WorkflowStatusChange', {previousStatus: beforeStatus.toString(), newStatus: afterStatus.toString()});
    });
      
  });

  describe("Test du démarrage de la session de vote", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
      await votingInstance.startProposalsRegistering({from: admin});
      await votingInstance.endProposalsRegistering({from: admin});      
    });

    it("should revert startVotingSession", async () => {
      await expectRevert(votingInstance.startVotingSession({from: registeredUser_2}), 'caller is not the owner');
    })

    it("should start VotingSession", async() => {
      const beforeStatus = await votingInstance.workflowStatus();
      expect(beforeStatus.toString()).to.equal(Voting.WorkflowStatus.ProposalsRegistrationEnded.toString());      
      
      const event = await votingInstance.startVotingSession({from: admin});
      
      const afterStatus = await votingInstance.workflowStatus();      
      expect(afterStatus.toString()).to.equal(Voting.WorkflowStatus.VotingSessionStarted.toString());
      expectEvent(event, 'WorkflowStatusChange', {previousStatus: beforeStatus.toString(), newStatus: afterStatus.toString()});
    });
      
  });

  describe("Test de la session de vote", function() {
    
    context('Test de l\'activation de la session de vote', function() {
      it("should have WorkflowStatus.VotingSessionStarted", async() => {
        votingInstance = await Voting.new({from: admin});

        await initVoters();

        await votingInstance.startProposalsRegistering({from: admin});
        await votingInstance.addProposal('proposition 0', {from: registeredUser_1});
        await votingInstance.addProposal('proposition 1', {from: registeredUser_2});

        await votingInstance.endProposalsRegistering({from: admin});

        await expectRevert(votingInstance.setVote(new BN(0), {from: admin}), 'Voting session havent started yet');
        
        await votingInstance.startVotingSession({from: admin});
        const status = await votingInstance.workflowStatus();
        expect(status.toString()).to.equal(Voting.WorkflowStatus.VotingSessionStarted.toString());
      });
    });
    
    beforeEach('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});

      await initVoters();

      await votingInstance.startProposalsRegistering({from: admin});
      await votingInstance.addProposal('proposition 0', {from: registeredUser_1});
      await votingInstance.addProposal('proposition 1', {from: registeredUser_2});

      await votingInstance.endProposalsRegistering({from: admin});
      await votingInstance.startVotingSession({from: admin});
    });    

    it("should revert, Not a voter", async () => {
      await expectRevert(votingInstance.setVote(new BN(0), {from: unregisteredUser}), 'You\'re not a voter');
    });

    it("should revert, Proposal not found", async() => {
      await expectRevert(votingInstance.setVote(new BN(10), {from: admin}), 'Proposal not found');
    });

    it("should revert, You have already voted", async() => {
      await votingInstance.setVote(new BN(1), {from: admin});
      await expectRevert(votingInstance.setVote(new BN(0), {from: admin}), 'You have already voted');
    });

    it("should vote", async() => {
      const _proposalId = new BN(0);
      const event = await votingInstance.setVote(_proposalId, {from: admin});
      const voter0 = await votingInstance.getVoter(admin);
      expectEvent(event, 'Voted', {voter: admin, proposalId: _proposalId})
      expect(voter0.votedProposalId).to.be.bignumber.equal(_proposalId);
      assert.isTrue(voter0.hasVoted);
      const _proposal = await votingInstance.getOneProposal(_proposalId);
      expect(_proposal.voteCount).to.be.bignumber.equal(new BN(1));

    });
       
  });

  describe("Test de l'arrêt des votes", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
      await votingInstance.startProposalsRegistering({from: admin});
      await votingInstance.endProposalsRegistering({from: admin});   
      await votingInstance.startVotingSession({from: admin});       
    });

    context('Test revert, session de vote inactive', function() {
      it('should revert: Voting session havent started yet', async() => {
        votingInstance = await Voting.new({from: admin});
        await votingInstance.startProposalsRegistering({from: admin});
        await votingInstance.endProposalsRegistering({from: admin});  
        await expectRevert(votingInstance.endVotingSession({from: admin}), 'Voting session havent started yet');
      });      
    });

    it("should revert endVotingSession", async () => {
      await expectRevert(votingInstance.endVotingSession({from: registeredUser_2}), 'caller is not the owner');
    });

    it("should end VotingSession", async() => {
      const beforeStatus = await votingInstance.workflowStatus();
      expect(beforeStatus.toString()).to.equal(Voting.WorkflowStatus.VotingSessionStarted.toString());      
      
      const event = await votingInstance.endVotingSession({from: admin});
      
      const afterStatus = await votingInstance.workflowStatus();      
      expect(afterStatus.toString()).to.equal(Voting.WorkflowStatus.VotingSessionEnded.toString());
      expectEvent(event, 'WorkflowStatusChange', {previousStatus: beforeStatus.toString(), newStatus: afterStatus.toString()});
    });
      
  });

  describe('Test de comptage des votes', function(){
    const _winningProposalId = new BN(1);
    
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
      await initVoters();

      await votingInstance.startProposalsRegistering({from: admin});
      await votingInstance.addProposal('proposition 0', {from: registeredUser_1});
      await votingInstance.addProposal('proposition 1', {from: registeredUser_2});
      await votingInstance.endProposalsRegistering({from: admin});
      
      await votingInstance.startVotingSession({from: admin});
      await votingInstance.setVote(new BN(0), {from: admin});
      await votingInstance.setVote(_winningProposalId, {from: registeredUser_1});
      await votingInstance.setVote(_winningProposalId, {from: registeredUser_2});
      await votingInstance.setVote(_winningProposalId, {from: registeredUser_3});
      await votingInstance.setVote(new BN(0), {from: registeredUser_4});
      await votingInstance.endVotingSession({from: admin});
    });

    
    context('Test revert, session de vote non terminée', function() {
      it('should revert: Current status is not voting session ended', async() => {
        votingInstance = await Voting.new({from: admin});  

        await expectRevert(votingInstance.tallyVotes({from: admin}), 'Current status is not voting session ended');
      });      
    });

    it("should revert tallyVotes: caller is not the owner", async () => {
      await expectRevert(votingInstance.tallyVotes({from: registeredUser_2}), 'caller is not the owner');
    });

    it('should get vote tallied', async() => {
      const beforeStatus = await votingInstance.workflowStatus();
      expect(beforeStatus.toString()).to.equal(Voting.WorkflowStatus.VotingSessionEnded.toString());
      const event = await votingInstance.tallyVotes({from: admin});
      const afterStatus = await votingInstance.workflowStatus();
      expectEvent(event, 'WorkflowStatusChange', {previousStatus: beforeStatus, newStatus: afterStatus});
      expect(await votingInstance.winningProposalID()).to.be.bignumber.equal(_winningProposalId);
    })
    
  });

  async function initVoters() { 
    await votingInstance.addVoter(admin, {from: admin});
    await votingInstance.addVoter(registeredUser_1, {from: admin});
    await votingInstance.addVoter(registeredUser_2, {from: admin});
    await votingInstance.addVoter(registeredUser_3, {from: admin});
    await votingInstance.addVoter(registeredUser_4, {from: admin});
  }

});
