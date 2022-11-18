const sendWithEmptyCalldata = (contract, from, value) => {
  return from.sendTransaction({
    to: contract.address,
    value
  })
}

const sendByFallback = (contract, from, value) => {
  const nonExistentFuncSignature = 'nonExistentFunc(uint256,uint256)'
  const fakeDemoContract = new ethers.Contract(
    contract.address,
    [
      ...contract.interface.fragments,
      `function ${nonExistentFuncSignature} payable`
    ],
    from
  )
  const tx = fakeDemoContract[nonExistentFuncSignature](0, 0, { value })
  return tx
}

export { sendByFallback, sendWithEmptyCalldata }
