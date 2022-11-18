import { /* setupUsers, connectAndGetNamedAccounts, */ getNamedSigners } from '../src/signers'
import { getDeploymentArguments } from '../src/getDeploymentArguments'
import { sendByFallback, sendWithEmptyCalldata } from './utils/native-token-send-types'

// We import Chai to use its asserting functions here.
import { expect } from './utils/chai-setup'
import { ethers } from 'hardhat'

const tests = () => {
  it('Admin should be entitled to withdraw sent ethers to the contract', async () => {
    const balanceBefore = await ethers.provider.getBalance(this.deployer.address)
    await this.kingOfTheFools.connect(this.deployer).withdraw()
    const balanceAfter = await ethers.provider.getBalance(this.deployer.address)
    const balanceCredit = balanceAfter.sub(balanceBefore)
    expect(balanceCredit).to.be.bignumber.above(this.credit.sub(this.margin))
  })
  it('Non admin should not be entitled to withdraw sent ethers to the contract', async () => {
    const defaultAdminRole = await this.kingOfTheFools.DEFAULT_ADMIN_ROLE.call()
    await expect(this.kingOfTheFools.connect(this.first).withdraw())
      .to.be.revertedWith(`AccessControl: account ${this.first.address.toLowerCase()} is missing role ${defaultAdminRole}`)
  })
}

describe('NativeTokenReceiver contract', () => {
  beforeEach(async () => {
    await deployments.fixture(['KingOfTheFools'])
    this.kingOfTheFools = await ethers.getContract('KingOfTheFools')
    const namedSigners = await getNamedSigners()
    Object.assign(this, namedSigners, await getDeploymentArguments({ ...namedSigners }))
    this.credit = ethers.utils.parseEther('1.0')
    this.margin = ethers.utils.parseEther('0.1')
  })
  it('Should emit ReceivedWithEmptyCalldata', async () => {
    await expect(sendWithEmptyCalldata(this))
      .to.emit(this.kingOfTheFools, 'ReceivedWithEmptyCalldata')
      .withArgs(this.first.address, this.credit)
  })
  it('Should emit ReceivedByFallback', async () => {
    await expect(sendByFallback(this))
      .to.emit(this.kingOfTheFools, 'ReceivedByFallback')
      .withArgs(this.first.address, this.credit)
  })
  describe('Received with empty calldata', async () => {
    beforeEach(async () => {
      await sendWithEmptyCalldata(this)
    })
    tests()
  })
  describe('Received by fallback', async () => {
    beforeEach(async () => {
      await sendByFallback(this)
    })
    tests()
  })
})
