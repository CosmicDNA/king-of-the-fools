import { /* setupUsers, connectAndGetNamedAccounts, */ getNamedSigners } from '../src/signers'
import { getDeploymentArguments } from '../src/getDeploymentArguments'
import { sendByFallback, sendWithEmptyCalldata } from './utils/native-token-send-types'

// We import Chai to use its asserting functions here.
import { expect } from './utils/chai-setup'
import { ethers } from 'hardhat'

const tests = () => {
  it('Admin should be entitled to withdraw sent ethers to the contract', async () => {
    const balanceBefore = await ethers.provider.getBalance(this.deployer.address)
    await this.nativeTokenReceiver.connect(this.deployer).withdraw()
    const balanceAfter = await ethers.provider.getBalance(this.deployer.address)
    const balanceCredit = balanceAfter.sub(balanceBefore)
    expect(balanceCredit).to.be.bignumber.above(this.credit.sub(this.margin))
  })
  it('Non admin should not be entitled to withdraw sent ethers to the contract', async () => {
    const defaultAdminRole = await this.nativeTokenReceiver.DEFAULT_ADMIN_ROLE.call()
    await expect(this.nativeTokenReceiver.connect(this.first).withdraw())
      .to.be.revertedWith(`AccessControl: account ${this.first.address.toLowerCase()} is missing role ${defaultAdminRole}`)
  })
}

describe('NativeTokenReceiver contract', () => {
  beforeEach(async () => {
    const NativeTokenReceiver = await ethers.getContractFactory('NativeTokenReceiver', this.deployer)
    this.nativeTokenReceiver = await NativeTokenReceiver.deploy()
    const namedSigners = await getNamedSigners()
    Object.assign(this, namedSigners, await getDeploymentArguments({ ...namedSigners }))
    this.credit = ethers.utils.parseEther('1.0')
    this.margin = ethers.utils.parseEther('0.1')
  })
  it('Should emit ReceivedWithEmptyCalldata', async () => {
    await expect(sendWithEmptyCalldata(this.nativeTokenReceiver, this.first, this.credit))
      .to.emit(this.nativeTokenReceiver, 'ReceivedWithEmptyCalldata')
      .withArgs(this.first.address, this.credit)
  })
  it('Should emit ReceivedByFallback', async () => {
    await expect(sendByFallback(this.nativeTokenReceiver, this.first, this.credit))
      .to.emit(this.nativeTokenReceiver, 'ReceivedByFallback')
      .withArgs(this.first.address, this.credit)
  })
  describe('Received with empty calldata', async () => {
    beforeEach(async () => {
      await sendWithEmptyCalldata(this.nativeTokenReceiver, this.first, this.credit)
    })
    tests()
  })
  describe('Received by fallback', async () => {
    beforeEach(async () => {
      await sendByFallback(this.nativeTokenReceiver, this.first, this.credit)
    })
    tests()
  })
})
