const Voting = artifacts.require("Voting");

contract("Voting", function ( accounts ) {

  let voting;

  beforeEach('should setup the contract Voting', async () => {
    voting = await Voting.deployed();
  });

  it("should register voters", async() => {
    const admin = accounts[0];
    await voting.addVoter(admin);
    await voting.addVoter(accounts[1]);
    await voting.addVoter(accounts[2]);
    await voting.addVoter(accounts[3]);
    await voting.addVoter(accounts[4]);
    
    const voter0 = await voting.getVoter(accounts[0]);
    const voter1 = await voting.getVoter(accounts[1]);
    const voter2 = await voting.getVoter(accounts[2]);
    const voter3 = await voting.getVoter(accounts[3]);
    const voter4 = await voting.getVoter(accounts[4]);
    // console.log(voter0);
    assert.isTrue(voter0.isRegistered);
    assert.isTrue(voter1.isRegistered);
    assert.isTrue(voter2.isRegistered);
    assert.isTrue(voter3.isRegistered);
    assert.isTrue(voter4.isRegistered);  
  });

  it("should register proposals", async function () {
    await voting.startProposalsRegistering();
    await voting.addProposal("solidity");
    await voting.addProposal("java");

    const proposal1 = await voting.getOneProposal(0);
    const proposal2 = await voting.getOneProposal(1);
    assert.equal(proposal1.description, 'solidity');
    assert.equal(proposal2.description, 'java');
  });

  it("should vote", async () => {
    await voting.endProposalsRegistering();
    await voting.startVotingSession();

    await voting.setVote(0);
    const voter0 = await voting.getVoter(accounts[0]);
    assert.isTrue(voter0.hasVoted);
  
    await voting.setVote(0, {from: accounts[1]});
    const voter1 = await voting.getVoter(accounts[1]);
    assert.isTrue(voter1.hasVoted);
    
    await voting.setVote(1, {from: accounts[2]});
    const voter2 = await voting.getVoter(accounts[2]);
    assert.isTrue(voter2.hasVoted);

    await voting.setVote(1, {from: accounts[3]});
    const voter3 = await voting.getVoter(accounts[3]);
    assert.isTrue(voter3.hasVoted);

    await voting.setVote(1, {from: accounts[4]});
    const voter4 = await voting.getVoter(accounts[4]);
    assert.isTrue(voter4.hasVoted);
  });

  it("should get winningProposalId as #1", async () => {
    await voting.endVotingSession();
    await voting.tallyVotes();
    const winner = await voting.winningProposalID();
    assert.equal(winner, 1);
  });

});
