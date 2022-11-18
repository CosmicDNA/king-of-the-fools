import { /* setupUsers, connectAndGetNamedAccounts, */ getNamedSigners } from '../src/signers'
import { getDeploymentArguments } from '../src/getDeploymentArguments'
import { sendByFallback, sendWithEmptyCalldata } from './utils/native-token-send-types'

// We import Chai to use its asserting functions here.
import { expect } from './utils/chai-setup'
import { ethers } from 'hardhat'

describe('KingOfTheFools contract', () => {
  beforeEach(async () => {
    await deployments.fixture(['KingOfTheFools'])
    this.kingOfTheFools = await ethers.getContract('KingOfTheFools')
    const namedSigners = await getNamedSigners()
    Object.assign(this, namedSigners, await getDeploymentArguments({ ...namedSigners }))
    this.credit = ethers.utils.parseEther('1.0')
    this.margin = ethers.utils.parseEther('0.1')
  })
  describe('Should emit EthDepositAccepted', async () => {
    it('when received with empty calldata', async () => {
      await expect(sendWithEmptyCalldata(this))
        .to.emit(this.kingOfTheFools, 'EthDepositAccepted')
        .withArgs(this.first.address, this.credit)
    })
    it('when received by fallback', async () => {
      await expect(sendByFallback(this))
        .to.emit(this.kingOfTheFools, 'EthDepositAccepted')
        .withArgs(this.first.address, this.credit)
    })
  })
})
