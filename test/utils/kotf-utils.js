// We import Chai to use its asserting functions here.
import { expect } from './chai-setup'

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

export { compareBalances, getLedgerChange, getLedger, IncompatibleLedgersException, LedgerEntry, Ledger }
