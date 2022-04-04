//const { from } = require("form-data");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
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

  describe("Tests de l'enregistrement des electeurs par l'adminnistarteur", function() {
    before('should setup the contract Voting', async () => {
      votingInstance = await Voting.new({from: admin});
    });

    it("should register voters", async() => {
      
      const status = await votingInstance.workflowStatus();
      //console.log(Voting.WorkflowStatus);
      expect(status.toString()).to.equal(Voting.WorkflowStatus.RegisteringVoters.toString());
      
      await votingInstance.addVoter(admin, {from: admin});
      await votingInstance.addVoter(registeredUser_1, {from: admin});
      await votingInstance.addVoter(registeredUser_2, {from: admin});
      
      const voter0 = await votingInstance.getVoter(accounts[0]);
      assert.isTrue(voter0.isRegistered);

      const voter1 = await votingInstance.getVoter(accounts[1])
      assert.isTrue(voter1.isRegistered);

      const voter2 = await votingInstance.getVoter(accounts[2]);
      assert.isTrue(voter2.isRegistered);  
    });

    it("should revert registering voter", async () => {
      await expectRevert(votingInstance.addVoter(unregisteredUser, {from: registeredUser_2}), 'caller is not the owner');
    })

  });


});
