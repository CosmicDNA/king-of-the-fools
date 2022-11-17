import { getNamedSigners } from '../src/signers'
import verify from '../src/hreVerify'

const func = async (hre) => {
  const { deployments } = hre
  const { deploy } = deployments
  const namedSigners = await getNamedSigners()
  const { deployer } = namedSigners

  const args = []
  const libraries = []

  const kingOfTheFools = await deploy('KingOfTheFools', {
    from: deployer.address,
    args,
    libraries,
    log: true
  })

  if (hre.network.name !== 'hardhat' && hre.network.name !== 'ganache') {
    await verify(kingOfTheFools.address, args, libraries)
  }
}
export default func
func.tags = ['KingOfTheFools']
