const Voting = artifacts.require("Voting");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Voting", function ( accounts ) {

  let voting;

  beforeEach('should setup the contract Voting', async () => {
    voting = await Voting.deployed();
  });

  it("should register voters", async() => {
    const admin = accounts[0];
    await voting.registerVoter(admin);
    await voting.registerVoter(accounts[1]);
    await voting.registerVoter(accounts[2]);
    await voting.registerVoter(accounts[3]);
    await voting.registerVoter(accounts[4]);
    
    const voter0 = await voting.voters(accounts[0]);
    const voter1 = await voting.voters(accounts[1]);
    const voter2 = await voting.voters(accounts[2]);
    const voter3 = await voting.voters(accounts[3]);
    const voter4 = await voting.voters(accounts[4]);
    // console.log(voter0);
    assert.isTrue(voter0.isRegistered);
    assert.isTrue(voter1.isRegistered);
    assert.isTrue(voter2.isRegistered);
    assert.isTrue(voter3.isRegistered);
    assert.isTrue(voter4.isRegistered);  
  });

  it("should register proposals", async function () {
    await voting.startProposalRegistration();
    await voting.registerProposal("solidity");
    await voting.registerProposal("java");

    const proposal1 = await voting.proposals(0);
    const proposal2 = await voting.proposals(1);
    // const proposal3 = await voting.proposals(3);
    assert.equal(proposal1.description, 'solidity');
    assert.equal(proposal2.description, 'java');
    // assert.equal(proposal3.description, '');
  });

  it("should vote", async () => {
    await voting.stopProposalRegistration();
    await voting.startVotingSession();

    await voting.voting(0);
    const voter0 = await voting.voters(accounts[0]);
    assert.isTrue(voter0.hasVoted);
  
    await voting.voting(0, {from: accounts[1]});
    const voter1 = await voting.voters(accounts[1]);
    assert.isTrue(voter1.hasVoted);
    
    await voting.voting(1, {from: accounts[2]});
    const voter2 = await voting.voters(accounts[2]);
    assert.isTrue(voter1.hasVoted);

    await voting.voting(1, {from: accounts[3]});
    const voter3 = await voting.voters(accounts[3]);
    assert.isTrue(voter1.hasVoted);

    await voting.voting(1, {from: accounts[4]});
    const voter4 = await voting.voters(accounts[4]);
    assert.isTrue(voter1.hasVoted);
  });

  it("should get winningProposalId as #1", async () => {
    await voting.stopVotingSession();
    await voting.computeResult();
    const winner = await voting.winningProposalId();
    assert.equal(1, winner);
  });

});
