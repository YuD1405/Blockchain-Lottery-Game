import { expect } from "chai";
import { ethers } from "hardhat";

describe("Hello World", function () {
    it("Should return the initial message", async function () {
      const HelloWorld = await ethers.getContractFactory("HelloWorld");
      const hello = await HelloWorld.deploy("Hello Blockchain!");
      await hello.waitForDeployment();

      expect(await hello.getMessage()).to.equal("Hello Blockchain!");
    });

    it("Should update the message", async function () {
      const HelloWorld = await ethers.getContractFactory("HelloWorld");
      const hello = await HelloWorld.deploy("Hi!");
      await hello.waitForDeployment();

      await hello.setMessage("New Message");
      expect(await hello.getMessage()).to.equal("New Message");
    });
});
