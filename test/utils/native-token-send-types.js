const sendWithEmptyCalldata = (self, from, value) => {
  return from.sendTransaction({
    to: self.kingOfTheFools.address,
    value
  })
}

const sendByFallback = (self, from, value) => {
  const nonExistentFuncSignature = 'nonExistentFunc(uint256,uint256)'
  const fakeDemoContract = new ethers.Contract(
    self.kingOfTheFools.address,
    [
      ...self.kingOfTheFools.interface.fragments,
      `function ${nonExistentFuncSignature} payable`
    ],
    from
  )
  const tx = fakeDemoContract[nonExistentFuncSignature](0, 0, { value })
  return tx
}

export { sendByFallback, sendWithEmptyCalldata }
