const sendWithEmptyCalldata = (self) => {
  return self.first.sendTransaction({
    to: self.kingOfTheFools.address,
    value: self.credit
  })
}

const sendByFallback = (self) => {
  const nonExistentFuncSignature = 'nonExistentFunc(uint256,uint256)'
  const fakeDemoContract = new ethers.Contract(
    self.kingOfTheFools.address,
    [
      ...self.kingOfTheFools.interface.fragments,
      `function ${nonExistentFuncSignature} payable`
    ],
    self.first
  )
  const tx = fakeDemoContract[nonExistentFuncSignature](0, 0, { value: self.credit })
  return tx
}

export { sendByFallback, sendWithEmptyCalldata }
