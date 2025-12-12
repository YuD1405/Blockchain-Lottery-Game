import { ethers, network } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { RandomNumberConsumerV2Plus, MockVRFCoordinatorV2Plus } from "../typechain-types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random Number Consumer Unit Tests (From Chainlink GitHub)", async function () {
          async function deployRandomNumberConsumerFixture() {
              const [deployer] = await ethers.getSigners()

              const chainId = network.config.chainId!

              // Deploy our simple MockVRFCoordinatorV2Plus
              const MockVRFCoordinatorFactory = await ethers.getContractFactory(
                  "MockVRFCoordinatorV2Plus"
              )
              const mockVRFCoordinator = await MockVRFCoordinatorFactory.deploy()
              await mockVRFCoordinator.waitForDeployment()

              const subscriptionId = 1 // Simple subscription ID for testing
              const vrfCoordinatorAddress = await mockVRFCoordinator.getAddress()
              const keyHash = networkConfig[chainId]?.keyHash ||
                  "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc"

              // Deploy RandomNumberConsumerV2Plus
              const randomNumberConsumerV2PlusFactory = await ethers.getContractFactory(
                  "RandomNumberConsumerV2Plus"
              )
              const randomNumberConsumerV2Plus = await randomNumberConsumerV2PlusFactory
                  .connect(deployer)
                  .deploy(subscriptionId, vrfCoordinatorAddress, keyHash, ethers.ZeroAddress)
              await randomNumberConsumerV2Plus.waitForDeployment()

              return { randomNumberConsumerV2Plus, mockVRFCoordinator, subscriptionId }
          }

          describe("#requestRandomWords", async function () {
              describe("success", async function () {
                  it("Should successfully request a random number", async function () {
                      const { randomNumberConsumerV2Plus, mockVRFCoordinator } = await loadFixture(
                          deployRandomNumberConsumerFixture
                      )
                      
                      await expect(randomNumberConsumerV2Plus.requestRandomWords()).to.emit(
                          mockVRFCoordinator,
                          "RandomWordsRequested"
                      )
                  })

                  it("Should successfully request a random number and get a result", async function () {
                      const { randomNumberConsumerV2Plus, mockVRFCoordinator } = await loadFixture(
                          deployRandomNumberConsumerFixture
                      )
                      
                      await randomNumberConsumerV2Plus.requestRandomWords()
                      const requestId = await randomNumberConsumerV2Plus.s_requestId()

                      // Simulate callback from the oracle network
                      const randomWords = [
                          BigInt("123456789012345678901234567890"),
                          BigInt("987654321098765432109876543210")
                      ]
                      
                      await expect(
                          mockVRFCoordinator.fulfillRandomWords(requestId, randomWords)
                      ).to.emit(randomNumberConsumerV2Plus, "ReturnedRandomness")

                      const firstRandomNumber = await randomNumberConsumerV2Plus.s_randomWords(0)
                      const secondRandomNumber = await randomNumberConsumerV2Plus.s_randomWords(1)

                      expect(firstRandomNumber).to.equal(randomWords[0])
                      expect(secondRandomNumber).to.equal(randomWords[1])
                  })

                  it("Should successfully fire event on callback", async function () {
                      const { randomNumberConsumerV2Plus, mockVRFCoordinator } = await loadFixture(
                          deployRandomNumberConsumerFixture
                      )

                      await new Promise<void>(async (resolve, reject) => {
                          // Set up event listener
                          randomNumberConsumerV2Plus.once(
                              randomNumberConsumerV2Plus.filters.ReturnedRandomness(),
                              async () => {
                                  console.log("ReturnedRandomness event fired!")
                                  try {
                                      const firstRandomNumber = await randomNumberConsumerV2Plus.s_randomWords(0)
                                      const secondRandomNumber = await randomNumberConsumerV2Plus.s_randomWords(1)
                                      
                                      expect(firstRandomNumber).to.be.gt(0)
                                      expect(secondRandomNumber).to.be.gt(0)
                                      resolve()
                                  } catch (e) {
                                      reject(e)
                                  }
                              }
                          )
                          
                          // Request random words
                          await randomNumberConsumerV2Plus.requestRandomWords()
                          const requestId = await randomNumberConsumerV2Plus.s_requestId()
                          
                          // Fulfill the request with random words
                          const randomWords = [
                              BigInt("123456789012345678901234567890"),
                              BigInt("987654321098765432109876543210")
                          ]
                          await mockVRFCoordinator.fulfillRandomWords(requestId, randomWords)
                      })
                  })
              })
          })
      })
