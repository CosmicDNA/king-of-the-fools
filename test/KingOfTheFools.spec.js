import { /* setupUsers, connectAndGetNamedAccounts, */ getNamedSigners } from '../src/signers'
import { getDeploymentArguments } from '../src/getDeploymentArguments'
import { sendByFallback, sendWithEmptyCalldata } from './utils/native-token-send-types'
import { ethers } from 'hardhat'

// We import Chai to use its asserting functions here.
import { expect } from './utils/chai-setup'

class LedgerEntry {
  constructor (name, balance) {
    this.name = name
    this.balance = balance
  }

  valueOf () {
    return this.balance
  }
}

class Ledger {
  constructor (namedSigners) {
    this.namedSigners = namedSigners
  }

  async initialize () {
    this.entries = await Promise.all(Object.entries(this.namedSigners)
      .map(async (entry) => new LedgerEntry(entry[0], ethers.BigNumber.from(await web3.eth.getBalance(entry[1].address))))
    )
  }

  valueOf () {
    return this.entries.map(entry => entry.balance)
  }

  isCompatibleWith (other) {
    if (!(other instanceof Ledger)) return false
    const getKeys = (ledger) => {
      return ledger.entries.map(entry => entry.name)
    }
    return (JSON.stringify(getKeys(this)) === JSON.stringify(getKeys(other)))
  }

  sub (other) {
    if (!this.isCompatibleWith(other)) {
      throw new IncompatibleLedgersException()
    }
    const ledger = new Ledger(this.namedSigners)
    ledger.entries = this.entries.map((entry, index) => {
      return new LedgerEntry(entry.name, entry.balance.sub(other.entries[index].balance))
    })
    return ledger
  }
}

const getLedger = async (namedSigners) => {
  const ledger = new Ledger(namedSigners)
  await ledger.initialize()
  return ledger
}

class IncompatibleLedgersException extends Error {
  constructor (message) {
    super()
    this.message = message || 'Incompatible ledgers.'
  }
}

const getLedgerChange = (ledgerOne, ledgerTwo) => {
  if (!ledgerOne.isCompatibleWith(ledgerTwo)) {
    throw new IncompatibleLedgersException()
  }
  return ledgerOne.sub(ledgerTwo)
}

const compareBalances = (balancesA, balancesB) => {
  balancesA.forEach((balance, index) => {
    expect(balance).to.be.equal(balancesB[index])
  })
}

describe('KingOfTheFools contract', () => {
  beforeEach(async () => {
    await deployments.fixture(['KingOfTheFools'])
    this.kingOfTheFools = await ethers.getContract('KingOfTheFools')
    this.namedSigners = await getNamedSigners()
    Object.assign(this, this.namedSigners, await getDeploymentArguments({ ...this.namedSigners }))
    this.credit = ethers.utils.parseEther('1.0')
    this.margin = ethers.utils.parseEther('0.1')
  })
  it('Ownership transfer', async () => {
    const firstOwner = await this.kingOfTheFools.owner()
    expect(firstOwner).to.equal(this.deployer.address)
    await expect(this.kingOfTheFools.connect(this.deployer).transferOwnership(this.second.address))
      .to.emit(this.kingOfTheFools, 'OwnershipTransferred')
      .withArgs(this.deployer.address, this.second.address)
    const secondOwner = await this.kingOfTheFools.owner()
    expect(secondOwner).to.equal(this.second.address)
  })
  describe('Should emit EthDepositAccepted', async () => {
    it('when received with empty calldata', async () => {
      await expect(sendWithEmptyCalldata(this.kingOfTheFools, this.first, this.credit))
        .to.emit(this.kingOfTheFools, 'EthDepositAccepted')
        .withArgs(this.first.address, this.credit)
      const contractBalance = await web3.eth.getBalance(this.kingOfTheFools.address)
      expect(contractBalance).to.be.equal(this.credit)
    })
    it('when received by fallback', async () => {
      await expect(sendByFallback(this.kingOfTheFools, this.first, this.credit))
        .to.emit(this.kingOfTheFools, 'EthDepositAccepted')
        .withArgs(this.first.address, this.credit)
      const contractBalance = await web3.eth.getBalance(this.kingOfTheFools.address)
      expect(contractBalance).to.be.equal(this.credit)
    })
  })
  it('Canonical Example', async () => {
    const initialLedger = await getLedger(this.namedSigners)
    // 1. Smart contract is supposed to be empty
    let contractBalance = await web3.eth.getBalance(this.kingOfTheFools.address)
    expect(contractBalance).to.be.equal(ethers.utils.parseEther('0'))

    // 2. First person deposits 1 ETH there
    let tx = await this.first.sendTransaction({
      to: this.kingOfTheFools.address,
      value: this.credit
    })
    let fee = tx.gasPrice.mul(tx.gasLimit)
    const ledger01 = await getLedger(this.namedSigners)
    let ledgerDelta = getLedgerChange(initialLedger, ledger01).valueOf()
    let expectedDelta = [ethers.BigNumber.from(0), this.credit.add(fee), ethers.BigNumber.from(0)]

    // Assure nobody gets anything from this initial deposit.
    compareBalances(ledgerDelta, expectedDelta)

    // Assure contract still has the deposit.
    contractBalance = await web3.eth.getBalance(this.kingOfTheFools.address)
    expect(contractBalance).to.be.equal(this.credit)

    // 3. Second person deposits 1.5 ETH there
    this.secondDeposit = ethers.utils.parseEther('1.5')
    tx = await this.second.sendTransaction({
      to: this.kingOfTheFools.address,
      value: this.secondDeposit
    })
    fee = tx.gasPrice.mul(tx.gasLimit)
    const ledger02 = await getLedger(this.namedSigners)
    ledgerDelta = getLedgerChange(ledger01, ledger02).valueOf()
    expectedDelta = [ethers.BigNumber.from(0), this.secondDeposit.mul(-1), this.secondDeposit.add(fee)]

    // Assure the first person receives the second deposit
    compareBalances(ledgerDelta, expectedDelta)

    // Assure contract has only the first deposit.
    contractBalance = await web3.eth.getBalance(this.kingOfTheFools.address)
    expect(contractBalance).to.be.equal(this.credit)
  })
  describe('After initial deposit of 1 ETH', async () => {
    beforeEach('', async () => {
      // First person deposits 1 ETH there
      await this.first.sendTransaction({
        to: this.kingOfTheFools.address,
        value: this.credit
      })
    })
    it('revert when under 1.5x', async () => {
      // Second person deposits 1.49 ETH there
      const value = ethers.utils.parseEther('1.5').sub(ethers.BigNumber.from(1))
      await expect(this.second.sendTransaction({
        to: this.kingOfTheFools.address,
        value
      }))
        .to.be.revertedWith('Insufficient deposit')
    })
    it('should emit DepositTranferred', async () => {
      // Second person deposits 1.5 ETH there
      const value = ethers.utils.parseEther('1.5')
      await expect(this.second.sendTransaction({
        to: this.kingOfTheFools.address,
        value
      }))
        .to.emit(this.kingOfTheFools, 'DepositTranferred')
        .withArgs(this.second.address, this.first.address, value)
    })
  })
})
