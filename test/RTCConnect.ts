import { expect } from 'chai'
import hre from 'hardhat'

describe.only('RTCConnect', () => {
  it('Should set the right unlockTime', async (done) => {
    // const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture)
    const [owner, otherAccount] = await hre.ethers.getSigners()

    const RTCConnect = await hre.ethers.getContractFactory('RTCConnect')
    const rtcConnect = await RTCConnect.deploy()

    // rtcConnect.on('*', () => {

    // })

    const filter = rtcConnect.filters['OfferConnect(address,address,string)'](undefined, otherAccount)

    console.log(await filter.getTopicFilter())

    rtcConnect.on(filter, (from, to, offerCID, e) => {
      expect(from).to.equal(owner)
      expect(to).to.equal(otherAccount)
      expect(offerCID).to.equal('fakeCID')
      e.removedEvent()
      done()
    })

    rtcConnect.offerConnect(otherAccount, 'fakeCID')
  })
})
