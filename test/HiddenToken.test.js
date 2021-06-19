const Web3 = require("web3");
const assert = require("assert");
const ganache = require("ganache-cli");
const fs = require("fs");
const compiled = fs.readFileSync("build/contracts/HiddenToken.json", { encoding: "utf8" });

const web3 = new Web3(ganache.provider());

let contract;
let accounts;
let tokenName = "HiddenToken";
let tokenSymbol = "HITO";
let totalSupply = "1000000";
const { abi, bytecode } = JSON.parse(compiled);

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  contract = await new web3.eth.Contract(abi)
    .deploy({
      data: bytecode,
      arguments: [tokenName, tokenSymbol, totalSupply],
    })
    .send({
      from: accounts[0],
      gas: "1000000",
    });
});

describe("HiddenToken Contract", () => {
  describe("Initial", () => {
    it("deploys a contract", () => {
      assert.ok(contract.options.address);
    });

    it("deploys a contract with a name", async () => {
      const response = await contract.methods.name().call();
      assert.strictEqual(tokenName, response);
    });

    it("deploys a contract with a symbol", async () => {
      const response = await contract.methods.symbol().call();
      assert.strictEqual(tokenSymbol, response);
    });

    it("deploys a contract with totalSupply", async () => {
      const response = await contract.methods.totalSupply().call();
      assert.strictEqual(totalSupply, response);
    });

    it("return a balance of account", async () => {
      const response = await contract.methods.balanceOf(accounts[1]).call();
      assert.strictEqual(response, "0");
    });

    it("send total supply to the owner balance", async () => {
      const response = await contract.methods.balanceOf(accounts[0]).call();
      assert.strictEqual(response, totalSupply);
    });
  });

  describe("Transfers", () => {
    it("throw an error if you send more tokens than you have", async () => {
      try {
        await contract.methods.transfer(accounts[1], "1000").send({
          from: accounts[2],
        });
        assert.ok(false);
      } catch (err) {
        assert.ok(err);
        assert.strictEqual(err.results[err.hashes[0]].reason, "You do not have enough tokens");
      }
    });

    it("pass user if he/she has enough tokens", async () => {
      const response = await contract.methods.transfer(accounts[1], "1000").send({
        from: accounts[0],
      });
      assert.ok(response);
    });

    it("returns true if everything is ok", async () => {
      const response = await contract.methods.transfer(accounts[1], "100").send({
        from: accounts[0],
      });
      assert.strictEqual(response.status, true);
    });

    it("transfer tokens to another balance", async () => {
      await contract.methods.transfer(accounts[1], "1000").send({
        from: accounts[0],
      });
      const balance = await contract.methods.balanceOf(accounts[1]).call();
      assert.strictEqual(balance, "1000");
    });

    it("remove _value tokens from sender account", async () => {
      const initialBalance = await contract.methods.balanceOf(accounts[0]).call();
      await contract.methods.transfer(accounts[1], "1000").send({
        from: accounts[0],
      });
      const nextBalance = await contract.methods.balanceOf(accounts[0]).call();
      assert.strictEqual(String(+initialBalance - 1000), nextBalance);
    });

    it("add _value tokens to recepient account", async () => {
      const initialBalance = await contract.methods.balanceOf(accounts[1]).call();
      await contract.methods.transfer(accounts[1], "1000").send({
        from: accounts[0],
      });
      const nextBalance = await contract.methods.balanceOf(accounts[1]).call();
      assert.strictEqual(nextBalance, String(+initialBalance + 1000));
    });

    it("should fire Transfer event with transfer", async () => {
      contract.events.Transfer({}).on("data", (event) => {
        assert.strictEqual(event.event, "Transfer");
      });
      await contract.methods.transfer(accounts[1], "1000").send({
        from: accounts[0],
      });
    });
  });

  describe("Transfer From", () => {
    it("returns an allowance of some address", async () => {
      const response = await contract.methods.allowance(accounts[0], accounts[1]).call();
      assert.strictEqual(response, "0");
    });

    it("change the allowance", async () => {
      await contract.methods.approve(accounts[1], "1000").send({
        from: accounts[0],
      });
      const response = await contract.methods.allowance(accounts[0], accounts[1]).call();
      assert.strictEqual(response, "1000");
    });

    it("trigger Approval event on every approve function", async () => {
      contract.events.Approval({}).on("data", (event) => {
        assert.strictEqual(event.event, "Approval");
      });
      await contract.methods.approve(accounts[1], "1000").send({
        from: accounts[0],
      });
    });

    it("emit event with approval info", async () => {
      contract.events.Approval({}).on("data", (event) => {
        assert.strictEqual(event.returnValues["owner_"], accounts[0]);
        assert.strictEqual(event.returnValues["spender_"], accounts[1]);
        assert.strictEqual(event.returnValues["value_"], "1000");
      });
      await contract.methods.approve(accounts[1], "1000").send({
        from: accounts[0],
      });
    });
  });
});
