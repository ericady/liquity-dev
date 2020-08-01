const deploymentHelpers = require("../utils/deploymentHelpers.js")
const testHelpers = require("../utils/testHelpers.js")

const deployLiquity = deploymentHelpers.deployLiquity
const getAddresses = deploymentHelpers.getAddresses
const connectContracts = deploymentHelpers.connectContracts

const th = testHelpers.TestHelper
const mv = testHelpers.MoneyValues

contract('CDPManager - in Recovery Mode', async accounts => {
  const _1_Ether = web3.utils.toWei('1', 'ether')
  const _2_Ether = web3.utils.toWei('2', 'ether')
  const _3_Ether = web3.utils.toWei('3', 'ether')
  const _3pt5_Ether = web3.utils.toWei('3.5', 'ether')
  const _6_Ether = web3.utils.toWei('6', 'ether')
  const _9_Ether = web3.utils.toWei('9', 'ether')
  const _10_Ether = web3.utils.toWei('10', 'ether')
  const _20_Ether = web3.utils.toWei('20', 'ether')
  const _21_Ether = web3.utils.toWei('21', 'ether')
  const _22_Ether = web3.utils.toWei('22', 'ether')
  const _24_Ether = web3.utils.toWei('24', 'ether')
  const _25_Ether = web3.utils.toWei('25', 'ether')
  const _27_Ether = web3.utils.toWei('27', 'ether')
  const _30_Ether = web3.utils.toWei('30', 'ether')

  const [
    owner, 
    alice, bob, carol, dennis, erin, freddy, greta, harry, ida, 
    whale, defaulter_1, defaulter_2, defaulter_3, defaulter_4 ] = accounts;

    const defaulters = [defaulter_1, defaulter_2, defaulter_3, defaulter_4]

  let priceFeed
  let clvToken
  let poolManager
  let sortedCDPs
  let cdpManager
  let nameRegistry
  let activePool
  let stabilityPool
  let defaultPool
  let functionCaller
  let borrowerOperations

  beforeEach(async () => {
    const contracts = await deployLiquity()

    priceFeed = contracts.priceFeed
    clvToken = contracts.clvToken
    poolManager = contracts.poolManager
    sortedCDPs = contracts.sortedCDPs
    cdpManager = contracts.cdpManager
    nameRegistry = contracts.nameRegistry
    activePool = contracts.activePool
    stabilityPool = contracts.stabilityPool
    defaultPool = contracts.defaultPool
    functionCaller = contracts.functionCaller
    borrowerOperations = contracts.borrowerOperations

    const contractAddresses = getAddresses(contracts)
    await connectContracts(contracts, contractAddresses)
  })

  it("checkRecoveryMode(): Returns true if TCR falls below CCR", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })

    //  Alice and Bob withdraw such that the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })

    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '1500000000000000000')

    const recoveryMode_Before = await cdpManager.checkRecoveryMode();
    assert.isFalse(recoveryMode_Before)

    // --- TEST ---

    // price drops to 1ETH:150CLV, reducing TCR below 150%.  setPrice() calls checkTCRAndSetRecoveryMode() internally.
    await priceFeed.setPrice('150000000000000000000')

    // const price = await priceFeed.getPrice()
    // await cdpManager.checkTCRAndSetRecoveryMode(price)

    const recoveryMode_After = await cdpManager.checkRecoveryMode();
    assert.isTrue(recoveryMode_After)
  })

  it("checkRecoveryMode(): Returns true if TCR stays less than CCR", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })

    // Alice and Bob withdraw such that the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })

    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '1500000000000000000')

    // --- TEST ---

    // price drops to 1ETH:150CLV, reducing TCR below 150%
    await priceFeed.setPrice('150000000000000000000')

    const recoveryMode_Before = await cdpManager.checkRecoveryMode();
    assert.isTrue(recoveryMode_Before)

    await borrowerOperations.addColl(alice, alice, { from: alice, value: '1' })

    const recoveryMode_After = await cdpManager.checkRecoveryMode();
    assert.isTrue(recoveryMode_After)
  })

  it("checkRecoveryMode(): returns false if TCR stays above CCR", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _10_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })

    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })

    // --- TEST ---
    const recoveryMode_Before = await cdpManager.checkRecoveryMode();
    assert.isFalse(recoveryMode_Before)

    await borrowerOperations.withdrawColl(_1_Ether, alice, { from: alice })

    const recoveryMode_After = await cdpManager.checkRecoveryMode();
    assert.isFalse(recoveryMode_After)
  })

  it("checkRecoveryMode(): returns false if TCR rises above CCR", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })

    //  Alice and Bob withdraw such that the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })

    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '1500000000000000000')

    // --- TEST ---
    // price drops to 1ETH:150CLV, reducing TCR below 150%
    await priceFeed.setPrice('150000000000000000000')

    const recoveryMode_Before = await cdpManager.checkRecoveryMode();
    assert.isTrue(recoveryMode_Before)

    await borrowerOperations.addColl(alice, alice, { from: alice, value: _10_Ether })

    const recoveryMode_After = await cdpManager.checkRecoveryMode();
    assert.isFalse(recoveryMode_After)
  })

  // --- liquidate() with ICR < 100% ---

  it("liquidate(), with ICR < 100%: removes stake and updates totalStakes", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })

    //  Alice and Bob withdraw such that the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })

    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '1500000000000000000')


    const bob_Stake_Before = (await cdpManager.CDPs(bob))[2]
    const totalStakes_Before = await cdpManager.totalStakes()

    assert.equal(bob_Stake_Before, _3_Ether)
    assert.equal(totalStakes_Before, _6_Ether)

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check Bob's ICR falls to 75%
    const bob_ICR = await cdpManager.getCurrentICR(bob, price);
    assert.equal(bob_ICR, '750000000000000000')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    const bob_Stake_After = (await cdpManager.CDPs(bob))[2]
    const totalStakes_After = await cdpManager.totalStakes()

    assert.equal(bob_Stake_After, 0)
    assert.equal(totalStakes_After, _3_Ether)
  })

  it("liquidate(), with ICR < 100%: updates system snapshots correctly", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _3_Ether })

    //  Alice and Bob withdraw such that their ICRs and the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })
    await borrowerOperations.withdrawCLV('400000000000000000000', dennis, { from: dennis })

    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '1500000000000000000')

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%, and all CDPs below 100% ICR
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Dennis is liquidated
    await cdpManager.liquidate(dennis, { from: owner })

    const totalStakesSnaphot_before = (await cdpManager.totalStakesSnapshot()).toString()
    const totalCollateralSnapshot_before = (await cdpManager.totalCollateralSnapshot()).toString()

    assert.equal(totalStakesSnaphot_before, _6_Ether)
    assert.equal(totalCollateralSnapshot_before, _9_Ether)

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    const totalStakesSnaphot_After = (await cdpManager.totalStakesSnapshot())
    const totalCollateralSnapshot_After = (await cdpManager.totalCollateralSnapshot())

    assert.equal(totalStakesSnaphot_After, _3_Ether)
    // total collateral should always be 9, as all liquidations in this test case are full redistributions
    assert.equal(totalCollateralSnapshot_After, _9_Ether)
  })

  it("liquidate(), with ICR < 100%: closes the CDP and removes it from the CDP array", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })

    //  Alice and Bob withdraw such that the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })

    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '1500000000000000000')

    const bob_CDPStatus_Before = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_Before = await sortedCDPs.contains(bob)

    assert.equal(bob_CDPStatus_Before, 1) // status enum element 1 corresponds to "Active"
    assert.isTrue(bob_CDP_isInSortedList_Before)

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check Bob's ICR falls to 75%
    const bob_ICR = await cdpManager.getCurrentICR(bob, price);
    assert.equal(bob_ICR, '750000000000000000')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    // check Bob's CDP is successfully closed, and removed from sortedList
    const bob_CDPStatus_After = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_After = await sortedCDPs.contains(bob)
    assert.equal(bob_CDPStatus_After, 2)  // status enum element 2 corresponds to "Closed"
    assert.isFalse(bob_CDP_isInSortedList_After)
  })

  it("liquidate(), with ICR < 100%: only redistributes to active CDPs - no offset to Stability Pool", async () => {

    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _3_Ether })

    //  Alice and Bob withdraw such that their ICRs and the TCR is 150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', bob, { from: bob })
    await borrowerOperations.withdrawCLV('400000000000000000000', dennis, { from: dennis })

    // Alice deposits to SP
    await poolManager.provideToSP('400000000000000000000', { from: alice })

    // check rewards-per-unit-staked before
    const P_Before = (await poolManager.P()).toString()

    assert.equal(P_Before, '1000000000000000000')


    // const TCR = (await poolManager.getTCR()).toString()
    // assert.equal(TCR, '1500000000000000000')

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%, and all CDPs below 100% ICR
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // liquidate bob
    await cdpManager.liquidate(bob, { from: owner })

    // check SP rewards-per-unit-staked after liquidation - should be no increase
    const P_After = (await poolManager.P()).toString()

    assert.equal(P_After, '1000000000000000000')
  })

  // --- liquidate() with 100% < ICR < 110%

  it("liquidate(), with 100 < ICR < 110%: removes stake and updates totalStakes", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _21_Ether })

    //  Bob withdraws 2000 CLV, bringing his ICR to 210%
    await borrowerOperations.withdrawCLV('2000000000000000000000', bob, { from: bob })

    // Total TCR = 24*200/2000 = 240%
    const TCR = (await poolManager.getTCR()).toString()
    assert.equal(TCR, '2400000000000000000')

    const bob_Stake_Before = (await cdpManager.CDPs(bob))[2]
    const totalStakes_Before = await cdpManager.totalStakes()

    assert.equal(bob_Stake_Before, _21_Ether)
    assert.equal(totalStakes_Before, _24_Ether)

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR to 120%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check Bob's ICR falls to 105%
    const bob_ICR = await cdpManager.getCurrentICR(bob, price);
    assert.equal(bob_ICR, '1050000000000000000')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    const bob_Stake_After = (await cdpManager.CDPs(bob))[2]
    const totalStakes_After = await cdpManager.totalStakes()

    assert.equal(bob_Stake_After, 0)
    assert.equal(totalStakes_After, _3_Ether)
  })

  it("liquidate(), with 100% < ICR < 110%: updates system snapshots correctly", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _21_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _3_Ether })

    //  Alice and Dennis withdraw such that their ICR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', dennis, { from: dennis })

    //  Bob withdraws 2000 CLV, bringing his ICR to 210%
    await borrowerOperations.withdrawCLV('2000000000000000000000', bob, { from: bob })

    const totalStakesSnaphot_1 = (await cdpManager.totalStakesSnapshot()).toString()
    const totalCollateralSnapshot_1 = (await cdpManager.totalCollateralSnapshot()).toString()
    assert.equal(totalStakesSnaphot_1, 0)
    assert.equal(totalCollateralSnapshot_1, 0)

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%, and all CDPs below 100% ICR
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Dennis is liquidated
    await cdpManager.liquidate(dennis, { from: owner })

    /*
    Prior to Dennis liquidation, total stakes and total collateral were each 27 ether. 
  
    Check snapshots. Dennis' liquidated collateral is distributed and remains in the system. His 
    stake is removed, leaving 27 ether total collateral, and 24 ether total stakes. */

    const totalStakesSnaphot_2 = (await cdpManager.totalStakesSnapshot()).toString()
    const totalCollateralSnapshot_2 = (await cdpManager.totalCollateralSnapshot()).toString()
    assert.equal(totalStakesSnaphot_2, _24_Ether)
    assert.equal(totalCollateralSnapshot_2, _27_Ether)

    // check Bob's ICR is now in range 100% < ICR 110%
    const _110percent = web3.utils.toBN('1100000000000000000')
    const _100percent = web3.utils.toBN('1000000000000000000')

    const bob_ICR = (await cdpManager.getCurrentICR(bob, price))

    assert.isTrue(bob_ICR.lt(_110percent))
    assert.isTrue(bob_ICR.gt(_100percent))

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    /* After Bob's liquidation, Bob's stake (21 ether) should be removed from total stakes, 
    but his collateral should remain in the system. */
    const totalStakesSnaphot_3 = (await cdpManager.totalStakesSnapshot())
    const totalCollateralSnapshot_3 = (await cdpManager.totalCollateralSnapshot())
    assert.equal(totalStakesSnaphot_3, _3_Ether)
    assert.equal(totalCollateralSnapshot_3, _27_Ether)   // total collateral should always be 9, as all liquidations in this test case are full redistributions
  })

  it("liquidate(), with 100% < ICR < 110%: closes the CDP and removes it from the CDP array", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _21_Ether })

    //  Bob withdraws 2000 CLV, bringing his ICR to 210%
    await borrowerOperations.withdrawCLV('2000000000000000000000', bob, { from: bob })

    const bob_CDPStatus_Before = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_Before = await sortedCDPs.contains(bob)

    assert.equal(bob_CDPStatus_Before, 1) // status enum element 1 corresponds to "Active"
    assert.isTrue(bob_CDP_isInSortedList_Before)

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()


    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check Bob's ICR has fallen to 105%
    const bob_ICR = await cdpManager.getCurrentICR(bob, price);
    assert.equal(bob_ICR, '1050000000000000000')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    // check Bob's CDP is successfully closed, and removed from sortedList
    const bob_CDPStatus_After = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_After = await sortedCDPs.contains(bob)
    assert.equal(bob_CDPStatus_After, 2)  // status enum element 2 corresponds to "Closed"
    assert.isFalse(bob_CDP_isInSortedList_After)
  })

  it("liquidate(), with 100% < ICR < 110%: offsets as much debt as possible with the Stability Pool, then redistributes the remainder coll and debt", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _3_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _21_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _3_Ether })

    //  Alice and Dennis withdraw such that the TCR is ~150%
    await borrowerOperations.withdrawCLV('400000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('400000000000000000000', dennis, { from: dennis })

    // Alice deposits 400CLV to the Stability Pool
    await poolManager.provideToSP('400000000000000000000', { from: alice })

    // Bob withdraws 2000 CLV, bringing his ICR to 210%
    await borrowerOperations.withdrawCLV('2000000000000000000000', bob, { from: bob })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check Bob's ICR has fallen to 105%
    const bob_ICR = await cdpManager.getCurrentICR(bob, price);
    assert.equal(bob_ICR, '1050000000000000000')

    // check pool CLV before liquidation
    const stabilityPoolCLV_Before = (await poolManager.getStabilityPoolCLV()).toString()
    assert.equal(stabilityPoolCLV_Before, '400000000000000000000')

    // check Pool reward term before liquidation
    const P_Before = (await poolManager.P()).toString()

    assert.equal(P_Before, '1000000000000000000')

    /* Now, liquidate Bob. Liquidated coll is 21 ether, and liquidated debt is 2000 CLV.
    
    With 400 CLV in the StabilityPool, 400 CLV should be offset with the pool, leaving 0 in the pool.
  
    Stability Pool rewards for alice should be:
    CLVLoss: 400CLV
    ETHGain: (400 / 2000) * 21 = 4.2 ether

    After offsetting 400 CLV and 4.2 ether, the remainders - 1600 CLV and 16.8 ether - should be redistributed to all active CDPs.
   */
    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    const aliceExpectedDeposit = await poolManager.getCompoundedCLVDeposit(alice)
    const aliceExpectedETHGain = await poolManager.getCurrentETHGain(alice)

    assert.equal(aliceExpectedDeposit.toString(), 0)
    assert.equal(aliceExpectedETHGain.toString(), '4200000000000000000')

    /* Now, check redistribution to active CDPs. Remainders of 1600 CLV and 16.8 ether are distributed.
    
    Now, only Alice and Dennis have a stake in the system - 3 ether each, thus total stakes is 6 ether.
  
    Rewards-per-unit-staked from the redistribution should be:
  
    L_CLVDebt = 1600 / 6 = 266.666 CLV
    L_ETH = 16.8 /6 =  2.8 ether
    */
    const L_CLVDebt = (await cdpManager.L_CLVDebt()).toString()
    const L_ETH = (await cdpManager.L_ETH()).toString()

    assert.isAtMost(th.getDifference(L_CLVDebt, '266666666666666666667'), 100)
    assert.isAtMost(th.getDifference(L_ETH, '2800000000000000000'), 100)
  })

  // --- liquidate(), applied to loan with ICR > 110% that has the lowest ICR 

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool is empty: does nothing", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _2_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _2_Ether })

    //  Alice and Dennis withdraw 150 CLV, resulting in ICRs of 266%. 
    await borrowerOperations.withdrawCLV('150000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    //Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Check Bob's ICR is >110% but still lowest
    const bob_ICR = (await cdpManager.getCurrentICR(bob, price)).toString()
    const alice_ICR = (await cdpManager.getCurrentICR(alice, price)).toString()
    const dennis_ICR = (await cdpManager.getCurrentICR(dennis, price)).toString()
    assert.equal(bob_ICR, '1200000000000000000')
    assert.equal(alice_ICR, '1333333333333333333')
    assert.equal(dennis_ICR, '1333333333333333333')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    // Check that Pool rewards don't change
    const P_Before = (await poolManager.P()).toString()

    assert.equal(P_Before, '1000000000000000000')

    // Check that redistribution rewards don't change
    const L_CLVDebt = (await cdpManager.L_CLVDebt()).toString()
    const L_ETH = (await cdpManager.L_ETH()).toString()

    assert.equal(L_CLVDebt, '0')
    assert.equal(L_ETH, '0')

    // Check that Bob's CDP and stake remains active with unchanged coll and debt
    const bob_CDP = await cdpManager.CDPs(bob);
    const bob_Debt = bob_CDP[0].toString()
    const bob_Coll = bob_CDP[1].toString()
    const bob_Stake = bob_CDP[2].toString()
    const bob_CDPStatus = bob_CDP[3].toString()
    const bob_isInSortedCDPsList = await sortedCDPs.contains(bob)

    assert.equal(bob_Debt, '250000000000000000000')
    assert.equal(bob_Coll, '3000000000000000000')
    assert.equal(bob_Stake, '3000000000000000000')
    assert.equal(bob_CDPStatus, '1')
    assert.isTrue(bob_isInSortedCDPsList)
  })

  // --- liquidate(), applied to loan with ICR > 110% that has the lowest ICR, and Stability Pool CLV is GREATER THAN liquidated debt ---

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV > liquidated debt: offsets the loan entirely with the pool", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits all 1500 CLV in the Stability Pool
    await poolManager.provideToSP('1500000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Check Bob's ICR is > 110% but still lowest
    bob_ICR = (await cdpManager.getCurrentICR(bob, price)).toString()
    alice_ICR = (await cdpManager.getCurrentICR(alice, price)).toString()
    dennis_ICR = (await cdpManager.getCurrentICR(dennis, price)).toString()
    assert.equal(bob_ICR, '1200000000000000000')
    assert.equal(alice_ICR, '1333333333333333333')
    assert.equal(dennis_ICR, '1333333333333333333')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    /* Check accrued Stability Pool rewards after. Total Pool deposits was 1500 CLV, Alice sole depositor.
    As liquidated debt (250 CLV) was completely offset

    Alice's expected compounded deposit: (1500 - 250) = 1250CLV
    Alice's expected ETH gain:  Bob's liquidated coll, 3 ether
  
    */
    const aliceExpectedDeposit = await poolManager.getCompoundedCLVDeposit(alice)
    const aliceExpectedETHGain = await poolManager.getCurrentETHGain(alice)

    assert.isAtMost(th.getDifference(aliceExpectedDeposit.toString(), '1250000000000000000000'), 1000)
    assert.equal(aliceExpectedETHGain, _3_Ether)
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV > liquidated debt: removes stake and updates totalStakes", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits all 1500 CLV in the Stability Pool
    await poolManager.provideToSP('1500000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check stake and totalStakes before
    const bob_Stake_Before = (await cdpManager.CDPs(bob))[2]
    const totalStakes_Before = await cdpManager.totalStakes()

    assert.equal(bob_Stake_Before, _3_Ether)
    assert.equal(totalStakes_Before, _25_Ether)

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    // check stake and totalStakes after
    const bob_Stake_After = (await cdpManager.CDPs(bob))[2]
    const totalStakes_After = await cdpManager.totalStakes()

    assert.equal(bob_Stake_After, 0)
    assert.equal(totalStakes_After, _22_Ether)
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV > liquidated debt: updates system snapshots", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits all 1500 CLV in the Stability Pool
    await poolManager.provideToSP('1500000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // check system snapshots before
    const totalStakesSnaphot_before = (await cdpManager.totalStakesSnapshot()).toString()
    const totalCollateralSnapshot_before = (await cdpManager.totalCollateralSnapshot()).toString()

    assert.equal(totalStakesSnaphot_before, '0')
    assert.equal(totalCollateralSnapshot_before, '0')

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    const totalStakesSnaphot_After = (await cdpManager.totalStakesSnapshot())
    const totalCollateralSnapshot_After = (await cdpManager.totalCollateralSnapshot())

    // totalStakesSnapshot should have reduced to 22 ether - the sum of Alice's coll( 20 ether) and Dennis' coll (2 ether )
    assert.equal(totalStakesSnaphot_After, _22_Ether)
    // Total collateral should also reduce, since all liquidated coll has been moved to a reward for Stability Pool depositors
    assert.equal(totalCollateralSnapshot_After, _22_Ether)
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV > liquidated debt: closes the CDP", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits all 1500 CLV in the Stability Pool
    await poolManager.provideToSP('1500000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Check Bob's CDP is active
    const bob_CDPStatus_Before = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_Before = await sortedCDPs.contains(bob)

    assert.equal(bob_CDPStatus_Before, 1) // status enum element 1 corresponds to "Active"
    assert.isTrue(bob_CDP_isInSortedList_Before)

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    // Check Bob's CDP is closed after liquidation
    const bob_CDPStatus_After = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_After = await sortedCDPs.contains(bob)

    assert.equal(bob_CDPStatus_After, 2) // status enum element 2 corresponds to "Closed"
    assert.isFalse(bob_CDP_isInSortedList_After)
  })

  // --- liquidate() applied to loan with ICR > 110% that has the lowest ICR, and Stability Pool CLV is LESS THAN the liquidated debt ---

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV < liquidated debt: CDP remains active", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits 100 CLV in the Stability Pool
    await poolManager.provideToSP('100000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Check Bob's CDP is active
    const bob_CDPStatus_Before = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_Before = await sortedCDPs.contains(bob)

    assert.equal(bob_CDPStatus_Before, 1) // status enum element 1 corresponds to "Active"
    assert.isTrue(bob_CDP_isInSortedList_Before)

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    /* Since the pool only contains 100 CLV, and Bob's pre-liquidation debt was 250 CLV, 
    expect Bob's loan to only be partially offset, and remain active after liquidation */

    const bob_CDPStatus_After = (await cdpManager.CDPs(bob))[3]
    const bob_CDP_isInSortedList_After = await sortedCDPs.contains(bob)

    assert.equal(bob_CDPStatus_After, 1) // status enum element 1 corresponds to "Active"
    assert.isTrue(bob_CDP_isInSortedList_After)
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV < liquidated debt: updates loan coll, debt and stake, and system totalStakes", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits 100 CLV in the Stability Pool
    await poolManager.provideToSP('100000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    /*  Since Bob's debt (250 CLV) is larger than all CLV in the Stability Pool, Liquidation should offset 
    a portion Bob's debt and coll with the Stability Pool, and leave remainders of debt and coll in his CDP. Specifically:

    Offset debt: 100 CLV
    Offset coll: (100 / 250) * 3  = 1.2 ether

    Remainder debt: 150 CLV
    Remainder coll: (3 - 1.2) = 1.8 ether 

    After liquidation, totalStakes snapshot should equal Alice's stake (20 ether) + Dennis stake (2 ether) = 22 ether.

    Since there has been no redistribution, the totalCollateral snapshot should equal the totalStakes snapshot: 22 ether.
    
    Then, Bob's new reduced coll and stake should each be 1.8 ether, and the updated totalStakes should equal 23.8 ether.
    */
    const bob_CDP = await cdpManager.CDPs(bob)
    const bob_DebtAfter = bob_CDP[0].toString()
    const bob_CollAfter = bob_CDP[1].toString()
    const bob_StakeAfter = bob_CDP[2].toString()

    assert.equal(bob_DebtAfter, '150000000000000000000')
    assert.equal(bob_CollAfter, '1800000000000000000')
    assert.equal(bob_StakeAfter, '1800000000000000000')

    const totalStakes_After = (await cdpManager.totalStakes()).toString()
    assert.equal(totalStakes_After, '23800000000000000000')
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV < liquidated debt: updates system shapshots", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits 100 CLV in the Stability Pool
    await poolManager.provideToSP('100000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Check snapshots before
    const totalStakesSnaphot_Before = (await cdpManager.totalStakesSnapshot()).toString()
    const totalCollateralSnapshot_Before = (await cdpManager.totalCollateralSnapshot()).toString()

    assert.equal(totalStakesSnaphot_Before, 0)
    assert.equal(totalCollateralSnapshot_Before, 0)

    // Liquidate Bob
    await cdpManager.liquidate(bob, { from: owner })

    /* After liquidation, totalStakes snapshot should equal Alice's stake (20 ether) + Dennis stake (2 ether) = 22 ether.

    Since there has been no redistribution, the totalCollateral snapshot should equal the totalStakes snapshot: 22 ether.*/

    const totalStakesSnaphot_After = (await cdpManager.totalStakesSnapshot()).toString()
    const totalCollateralSnapshot_After = (await cdpManager.totalCollateralSnapshot()).toString()

    assert.equal(totalStakesSnaphot_After, '22000000000000000000')
    assert.equal(totalCollateralSnapshot_After, '22000000000000000000')
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV < liquidated debt: causes correct Pool offset and ETH gain, and doesn't redistribute to active troves", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, resulting in ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })
    // Bob withdraws 250 CLV, resulting in ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })

    // Alice deposits 100 CLV in the Stability Pool
    await poolManager.provideToSP('100000000000000000000', { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice('100000000000000000000')

    const recoveryMode = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode)

    // Liquidate Bob. 100 CLV should be offset
    await cdpManager.liquidate(bob, { from: owner })

    /* check Stability Pool rewards.  After Bob's liquidation:
    - amount of CLV offset with Stability Pool should be 100 CLV
    - corresponding amount of ETH added to Stability Pool should be 100/250 * 3 = 1.2 ether.

    - Alice's deposit (100 CLV) should fully cancel with the debt, leaving her a withdrawable deposit of 0
  
    Her ETH gain from offset should be (3 * 100/250) = 1.2 Ether.
    */

    const aliceExpectedDeposit = await poolManager.getCompoundedCLVDeposit(alice)
    const aliceExpectedETHGain = await poolManager.getCurrentETHGain(alice)

    assert.equal(aliceExpectedDeposit.toString(), '0')

    assert.isAtMost(th.getDifference(aliceExpectedETHGain, '1200000000000000000'), 100)

    /* For this Recovery Mode test case with ICR > 110%, there should be no redistribution of remainder to active CDPs. 
    Redistribution rewards-per-unit-staked should be zero. */

    const L_CLVDebt_After = (await cdpManager.L_CLVDebt()).toString()
    const L_ETH_After = (await cdpManager.L_ETH()).toString()

    assert.equal(L_CLVDebt_After, '0')
    assert.equal(L_ETH_After, '0')
  })

  it("liquidate(), with ICR > 110%, loan has lowest ICR, and StabilityPool CLV < liquidated debt: ICR of partially liquidated trove does not change", async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(0, alice, { from: alice, value: _20_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, carol, { from: carol, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _2_Ether })

    // Alice withdraws 1500 CLV, and Dennis 150 CLV, -> ICRs of 266%.  
    await borrowerOperations.withdrawCLV('1500000000000000000000', alice, { from: alice })
    await borrowerOperations.withdrawCLV('150000000000000000000', dennis, { from: dennis })

    // Bob withdraws 250 CLV, -> ICR of 240%. Bob has lowest ICR.
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob })
    // Carol withdraws 240 CLV, -> ICR of 250%.
    await borrowerOperations.withdrawCLV('240000000000000000000', carol, { from: carol })

    // Alice deposits 100 CLV in the Stability Pool
    await poolManager.provideToSP(mv._100e18, { from: alice })

    // --- TEST ---
    // price drops to 1ETH:100CLV, reducing TCR below 150%
    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    const bob_ICR_Before = (await cdpManager.getCurrentICR(bob, price)).toString()
    const carol_ICR_Before = (await cdpManager.getCurrentICR(carol, price)).toString()

    assert.isTrue(await cdpManager.checkRecoveryMode())

    const bob_Coll_Before = (await cdpManager.CDPs(bob))[1]
    const bob_Debt_Before = (await cdpManager.CDPs(bob))[0]

    // confirm Bob is last trove in list, and has >110% ICR
    assert.equal((await sortedCDPs.getLast()).toString(), bob)
    assert.isTrue((await cdpManager.getCurrentICR(bob, price)).gt(mv._MCR))

    // L1: Liquidate Bob. 100 CLV should be offset
    await cdpManager.liquidate(bob, { from: owner })

    //Check SP CLV has been completely emptied
    assert.equal((await stabilityPool.getCLV()).toString(), '0')

    // Check Bob remains active
    assert.isTrue(await sortedCDPs.contains(bob))

    // Check Bob's collateral and debt has reduced from the partial liquidation
    const bob_Coll_After = (await cdpManager.CDPs(bob))[1]
    const bob_Debt_After = (await cdpManager.CDPs(bob))[0]
    assert.isTrue(bob_Coll_After.lt(bob_Coll_Before))
    assert.isTrue(bob_Debt_After.lt(bob_Debt_Before))

    const bob_ICR_After = (await cdpManager.getCurrentICR(bob, price)).toString()

    // check Bob's ICR has not changed from the partial liquidation
    assert.equal(bob_ICR_After, bob_ICR_Before)


    // Remove Bob from system to test Carol's trove: price rises, Bob closes loan, price drops to 100 again
    await priceFeed.setPrice(mv._200e18)
    await borrowerOperations.closeLoan({from: bob})
    await priceFeed.setPrice(mv._100e18)
    assert.isFalse(await sortedCDPs.contains(bob))
    
    // Alice provides another 50 CLV to pool
    await poolManager.provideToSP(mv._50e18, { from: alice })

    assert.isTrue(await cdpManager.checkRecoveryMode())

    const carol_Coll_Before = (await cdpManager.CDPs(carol))[1]
    const carol_Debt_Before = (await cdpManager.CDPs(carol))[0]

    // Confirm Carol is last trove in list, and has >110% ICR
    assert.equal((await sortedCDPs.getLast()), carol)
    assert.isTrue((await cdpManager.getCurrentICR(carol, price)).gt(mv._MCR))

    // L2: Liquidate Carol. 50 CLV should be offset
    await cdpManager.liquidate(carol)

    //Check SP CLV has been completely emptied
    assert.equal((await stabilityPool.getCLV()).toString(), '0')

    // Check Carol's collateral and debt has reduced from the partial liquidation
    const carol_Coll_After = (await cdpManager.CDPs(carol))[1]
    const carol_Debt_After = (await cdpManager.CDPs(carol))[0]
    assert.isTrue(carol_Coll_After.lt(carol_Coll_Before))
    assert.isTrue(carol_Debt_After.lt(carol_Debt_Before))

    const carol_ICR_After = (await cdpManager.getCurrentICR(carol, price)).toString()

    // check Carol's ICR has not changed from the partial liquidation
    assert.equal(carol_ICR_After, carol_ICR_Before)

    //Confirm liquidations have not led to any redistributions to troves
    const L_CLVDebt_After = (await cdpManager.L_CLVDebt()).toString()
    const L_ETH_After = (await cdpManager.L_ETH()).toString()

    assert.equal(L_CLVDebt_After, '0')
    assert.equal(L_ETH_After, '0')
  })

  it("liquidate(): Doesn't liquidate undercollateralized trove if it is the only trove in the system", async () => {
    // Alice creates a single trove with 0.5 ETH and a debt of 50 LQTY, and provides 10 CLV to SP
    await borrowerOperations.openLoan(mv._50e18, alice, { from: alice, value: mv._5e17 })
    await poolManager.provideToSP(mv._10e18, { from: alice })

    assert.isFalse(await cdpManager.checkRecoveryMode())

    // Set ETH:USD price to 105
    await priceFeed.setPrice('105000000000000000000')
    const price = await priceFeed.getPrice()

    assert.isTrue(await cdpManager.checkRecoveryMode())

    const alice_ICR = (await cdpManager.getCurrentICR(alice, price)).toString()
    assert.equal(alice_ICR, '1050000000000000000')

    const activeTrovesCount_Before = await cdpManager.getCDPOwnersCount()

    assert.equal(activeTrovesCount_Before, 1)

    // Liquidate the trove
    await cdpManager.liquidate(alice, { from: owner })

    // Check Alice's trove has not been removed
    const activeTrovesCount_After = await cdpManager.getCDPOwnersCount()
    assert.equal(activeTrovesCount_After, 1)

    const alice_isInSortedList = await sortedCDPs.contains(alice)
    assert.isTrue(alice_isInSortedList)
  })

  it("liquidate(): Liquidates undercollateralized trove if there are two troves in the system", async () => {
    await borrowerOperations.openLoan(mv._50e18, bob, { from: bob, value: mv._5e17 })

    // Alice creates a single trove with 0.5 ETH and a debt of 50 LQTY,  and provides 10 CLV to SP
    await borrowerOperations.openLoan(mv._50e18, alice, { from: alice, value: mv._5e17 })
    await poolManager.provideToSP(mv._10e18, { from: alice })

    // Alice proves 10 CLV to SP
    await poolManager.provideToSP(mv._10e18, { from: alice })

    assert.isFalse(await cdpManager.checkRecoveryMode())

    // Set ETH:USD price to 105
    await priceFeed.setPrice('105000000000000000000')
    const price = await priceFeed.getPrice()

    assert.isTrue(await cdpManager.checkRecoveryMode())

    const alice_ICR = (await cdpManager.getCurrentICR(alice, price)).toString()
    assert.equal(alice_ICR, '1050000000000000000')

    const activeTrovesCount_Before = await cdpManager.getCDPOwnersCount()

    assert.equal(activeTrovesCount_Before, 2)

    // Liquidate the trove
    await cdpManager.liquidate(alice, { from: owner })

    // Check Alice's trove is removed, and bob remains
    const activeTrovesCount_After = await cdpManager.getCDPOwnersCount()
    assert.equal(activeTrovesCount_After, 1)

    const alice_isInSortedList = await sortedCDPs.contains(alice)
    assert.isFalse(alice_isInSortedList)

    const bob_isInSortedList = await sortedCDPs.contains(bob)
    assert.isTrue(bob_isInSortedList)
  })

  it("liquidate(): does nothing if trove has non-zero coll, zero debt, and infinite ICR", async () => {
    await borrowerOperations.openLoan(mv._1000e18, alice, { from: alice, value: mv._10_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: mv._1_Ether })

    await priceFeed.setPrice('0')
    const price = await priceFeed.getPrice()

    const TCR_Before = (await poolManager.getTCR()).toString()
    const listSize_Before = (await sortedCDPs.getSize()).toString()

    assert.isTrue(await cdpManager.checkRecoveryMode())
    
    const bob_ICR = web3.utils.toHex(await cdpManager.getCurrentICR(bob, price))
    const maxBytes32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

    assert.equal(bob_ICR, maxBytes32)

    // Attempt to liquidate bob
    await cdpManager.liquidate(bob)

    // check bob active, check alice active
    assert.isTrue((await sortedCDPs.contains(bob)))
    assert.isTrue((await sortedCDPs.contains(alice)))

    const TCR_After = (await poolManager.getTCR()).toString()
    const listSize_After = (await sortedCDPs.getSize()).toString()

    assert.equal(TCR_Before, TCR_After)
    assert.equal(listSize_Before, listSize_After)
  })

  it("liquidate(): does nothing if trove has >= 110% ICR and the Stability Pool is empty", async () => {
    await borrowerOperations.openLoan(mv._100e18, alice, { from: alice, value: mv._2_Ether })
    await borrowerOperations.openLoan(mv._90e18, bob, { from: bob, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._150e18, carol, { from: carol, value: mv._2_Ether })

    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    const TCR_Before = (await poolManager.getTCR()).toString()
    const listSize_Before = (await sortedCDPs.getSize()).toString()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Check Bob's ICR > 110%
    const bob_ICR = await cdpManager.getCurrentICR(bob, price)
    assert.isTrue(bob_ICR.gte(mv._MCR))

    // Confirm SP is empty
    const CLVinSP = (await stabilityPool.getCLV()).toString()
    assert.equal(CLVinSP, '0')

    // Attempt to liquidate bob
    await cdpManager.liquidate(bob)

    // check A, B, C remain active
    assert.isTrue((await sortedCDPs.contains(bob)))
    assert.isTrue((await sortedCDPs.contains(alice)))
    assert.isTrue((await sortedCDPs.contains(carol)))

    const TCR_After = (await poolManager.getTCR()).toString()
    const listSize_After = (await sortedCDPs.getSize()).toString()
    
    // Check TCR and list size have not changed
    assert.equal(TCR_Before, TCR_After)
    assert.equal(listSize_Before, listSize_After)
  })

  it("liquidate(): reverts if trove is non-existent", async () => {
    await borrowerOperations.openLoan(mv._100e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._150e18, bob, { from: bob, value: mv._1_Ether })

    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Check Carol does not have an existing trove
    assert.equal(await cdpManager.getCDPStatus(carol), 0) 
    assert.isFalse(await sortedCDPs.contains(carol))

    try {
      const txCarol = await cdpManager.liquidate(carol)

      assert.isFalse(txCarol.receipt.status)
    } catch (err) {
      assert.include(err.message, "revert")
      assert.include(err.message, "Trove does not exist or is closed")
    }
  })

  it("liquidate(): reverts if trove has been closed", async () => {
    await borrowerOperations.openLoan(mv._100e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._150e18, bob, { from: bob, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._150e18, carol, { from: carol, value: mv._1_Ether })

    assert.isTrue(await sortedCDPs.contains(carol))

    // Price drops, Carol ICR falls below MCR
    await priceFeed.setPrice(mv._100e18)

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Carol liquidated, and her trove is closed
    const txCarol_L1 = await cdpManager.liquidate(carol)
    assert.isTrue(txCarol_L1.receipt.status)

    // Check Carol's trove is closed
    assert.isFalse(await sortedCDPs.contains(carol))
    assert.equal(await cdpManager.getCDPStatus(carol), 2) 

    try {
      const txCarol_L2 = await cdpManager.liquidate(carol)

      assert.isFalse(txCarol_L2.receipt.status)
    } catch (err) {
      assert.include(err.message, "revert")
      assert.include(err.message, "Trove does not exist or is closed")
    }
  })

  it("liquidate(): liquidates based on entire/collateral debt (including pending rewards), not raw collateral/debt", async () => {
    await borrowerOperations.openLoan(mv._50e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan('90500000000000000000', bob, { from: bob, value: mv._1_Ether })  // 90.5 CLV, 1 ETH
    await borrowerOperations.openLoan(mv._100e18, carol, { from: carol, value: mv._1_Ether })

    // Defaulter opens with 30 CLV, 0.3 ETH
    await borrowerOperations.openLoan(mv._30e18, defaulter_1, { from: defaulter_1, value: mv._3e17 })

    // Price drops
    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    const alice_ICR_Before = await cdpManager.getCurrentICR(alice, price)
    const bob_ICR_Before = await cdpManager.getCurrentICR(bob, price)
    const carol_ICR_Before = await cdpManager.getCurrentICR(carol, price)

    /* Before liquidation: 
    Alice ICR: = (1 * 100 / 50) = 200%
    Bob ICR: (1 * 100 / 90.5) = 110.5%
    Carol ICR: (1 * 100 / 100 ) =  100%

    Therefore Alice and Bob above the MCR, Carol is below */
    assert.isTrue(alice_ICR_Before.gte(mv._MCR))
    assert.isTrue(bob_ICR_Before.gte(mv._MCR))
    assert.isTrue(carol_ICR_Before.lte(mv._MCR))

    // Liquidate defaulter. 30 CLV and 0.3 ETH is distributed uniformly between A, B and C. Each receive 10 CLV, 0.1 ETH
    await cdpManager.liquidate(defaulter_1)

    const alice_ICR_After = await cdpManager.getCurrentICR(alice, price)
    const bob_ICR_After = await cdpManager.getCurrentICR(bob, price)
    const carol_ICR_After = await cdpManager.getCurrentICR(carol, price)

    /* After liquidation: 

    Alice ICR: (1.1 * 100 / 60) = 183.33%
    Bob ICR:(1.1 * 100 / 100.5) =  109.45%
    Carol ICR: (1.1 * 100 ) 100%

    Check Alice is above MCR, Bob below, Carol below. */
    assert.isTrue(alice_ICR_After.gte(mv._MCR))
    assert.isTrue(bob_ICR_After.lte(mv._MCR))
    assert.isTrue(carol_ICR_After.lte(mv._MCR))

    /* Though Bob's true ICR (including pending rewards) is below the MCR, 
    check that Bob's raw coll and debt has not changed, and that his "raw" ICR is above the MCR */
    const bob_Coll = (await cdpManager.CDPs(bob))[1]
    const bob_Debt = (await cdpManager.CDPs(bob))[0]

    const bob_rawICR = bob_Coll.mul(mv._100e18BN).div(bob_Debt)
    assert.isTrue(bob_rawICR.gte(mv._MCR))

    //liquidate A, B, C
    await cdpManager.liquidate(alice)
    await cdpManager.liquidate(bob)
    await cdpManager.liquidate(carol)
   
    /*  Since there is 0 CLV in the stability Pool, A, with ICR >110%, should stay active.
    Check Alice stays active, Carol gets liquidated, and Bob gets liquidated 
    (because his pending rewards bring his ICR < MCR) */
    assert.isTrue(await sortedCDPs.contains(alice))
    assert.isFalse(await sortedCDPs.contains(bob))
    assert.isFalse(await sortedCDPs.contains(carol))

    // check trove statuses - A active (1), B and C closed (2)
    assert.equal((await cdpManager.CDPs(alice))[3].toString(), '1')
    assert.equal((await cdpManager.CDPs(bob))[3].toString(), '2')
    assert.equal((await cdpManager.CDPs(carol))[3].toString(), '2')
  })

  it("liquidate(): does not affect the SP deposit or ETH gain when called on an SP depositor's address that has no trove", async () => {
    await borrowerOperations.openLoan(mv._200e18, bob, { from: bob, value: mv._2_Ether })
    await borrowerOperations.openLoan(mv._100e18, carol, { from: carol, value: mv._1_Ether })

    // Bob sends tokens to Dennis, who has no trove
    await clvToken.transfer(dennis, mv._200e18, { from: bob })

    //Dennis provides 200 CLV to SP
    await poolManager.provideToSP(mv._200e18, { from: dennis })

    // Price drop
    await priceFeed.setPrice(mv._105e18)

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Carol gets liquidated
    await cdpManager.liquidate(carol)

    // Check Dennis' SP deposit has absorbed Carol's debt, and he has received her liquidated ETH
    const dennis_Deposit_Before = (await poolManager.getCompoundedCLVDeposit(dennis)).toString()
    const dennis_ETHGain_Before = (await poolManager.getCurrentETHGain(dennis)).toString()
    assert.isAtMost(th.getDifference(dennis_Deposit_Before, mv._100e18), 1000)
    assert.isAtMost(th.getDifference(dennis_ETHGain_Before, mv._1_Ether), 1000)

    // Attempt to liquidate Dennis
    try {
      const txDennis = await cdpManager.liquidate(dennis)
      assert.isFalse(txDennis.receipt.status)
    } catch (err) {
      assert.include(err.message, "revert")
      assert.include(err.message, "Trove does not exist or is closed")
    }

    // Check Dennis' SP deposit does not change after liquidation attempt
    const dennis_Deposit_After = (await poolManager.getCompoundedCLVDeposit(dennis)).toString()
    const dennis_ETHGain_After = (await poolManager.getCurrentETHGain(dennis)).toString()
    assert.equal(dennis_Deposit_Before, dennis_Deposit_After)
    assert.equal(dennis_ETHGain_Before, dennis_ETHGain_After)
  })

  it("liquidate(): does not alter the liquidated user's token balance", async () => {
    await borrowerOperations.openLoan(mv._1000e18, whale, { from: whale, value: mv._10_Ether })

    await borrowerOperations.openLoan(mv._300e18, alice, { from: alice, value: mv._3_Ether })
    await borrowerOperations.openLoan(mv._200e18, bob, { from: bob, value: mv._2_Ether })
    await borrowerOperations.openLoan(mv._100e18, carol, { from: carol, value: mv._1_Ether })

    await priceFeed.setPrice(mv._105e18)

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Check token balances 
    assert.equal((await clvToken.balanceOf(alice)).toString(), mv._300e18)
    assert.equal((await clvToken.balanceOf(bob)).toString(), mv._200e18)
    assert.equal((await clvToken.balanceOf(carol)).toString(), mv._100e18)

    // Check sortedList size is 4
    assert.equal((await sortedCDPs.getSize()).toString(), '4')

    // Liquidate A, B and C
    await cdpManager.liquidate(alice)
    await cdpManager.liquidate(bob)
    await cdpManager.liquidate(carol)

    // Confirm A, B, C closed
    assert.isFalse(await sortedCDPs.contains(alice))
    assert.isFalse(await sortedCDPs.contains(bob))
    assert.isFalse(await sortedCDPs.contains(carol))

    // Check sortedList size reduced to 1
    assert.equal((await sortedCDPs.getSize()).toString(), '1')

    // Confirm token balances have not changed
    assert.equal((await clvToken.balanceOf(alice)).toString(), mv._300e18)
    assert.equal((await clvToken.balanceOf(bob)).toString(), mv._200e18)
    assert.equal((await clvToken.balanceOf(carol)).toString(), mv._100e18)
  })
 
  // --- liquidateCDPs ---

  it("liquidateCDPs(): With all ICRs > 110%, Liquidates CDPs until system leaves recovery mode", async () => {
    // make 8 CDPs accordingly
    // --- SETUP ---

    await borrowerOperations.openLoan(0, alice, { from: alice, value: _25_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3pt5_Ether })
    await borrowerOperations.openLoan(0, carol, { from: carol, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _3_Ether })
    await borrowerOperations.openLoan(0, erin, { from: erin, value: _3_Ether })
    await borrowerOperations.openLoan(0, freddy, { from: freddy, value: _3_Ether })
    await borrowerOperations.openLoan(0, greta, { from: greta, value: _1_Ether })
    await borrowerOperations.openLoan(0, harry, { from: harry, value: _1_Ether })

    // Everyone withdraws some CLV from their CDP, resulting in different ICRs
    await borrowerOperations.withdrawCLV('1400000000000000000000', alice, { from: alice })  // 1400 CLV -> ICR = 400%
    await borrowerOperations.withdrawCLV('200000000000000000000', bob, { from: bob }) //  200 CLV -> ICR = 350%
    await borrowerOperations.withdrawCLV('210000000000000000000', carol, { from: carol }) // 210 CLV -> ICR = 286%
    await borrowerOperations.withdrawCLV('220000000000000000000', dennis, { from: dennis }) // 220 CLV -> ICR = 273%
    await borrowerOperations.withdrawCLV('230000000000000000000', erin, { from: erin }) // 230 CLV -> ICR = 261%
    await borrowerOperations.withdrawCLV('240000000000000000000', freddy, { from: freddy }) // 240 CLV -> ICR = 250%
    await borrowerOperations.withdrawCLV('85000000000000000000', greta, { from: greta }) // 85 CLV -> ICR = 235%
    await borrowerOperations.withdrawCLV('90000000000000000000', harry, { from: harry }) // 90 CLV ->  ICR = 222%

    // Alice deposits 1400 CLV to Stability Pool
    await poolManager.provideToSP('1400000000000000000000', { from: alice })

    // price drops
    // price drops to 1ETH:90CLV, reducing TCR below 150%
    await priceFeed.setPrice('90000000000000000000')
    const price = await priceFeed.getPrice()

    const recoveryMode_Before = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode_Before)

    // check TCR < 150%
    const _150percent = web3.utils.toBN('1500000000000000000')
    const TCR_Before = await poolManager.getTCR()
    assert.isTrue(TCR_Before.lt(_150percent))

    /* 
   After the price drop and prior to any liquidations, ICR should be:

    CDP         ICR
    Alice       161%
    Bob         158%
    Carol       129%
    Dennis      123%
    Elisa       117%
    Freddy      113%
    Greta       106%
    Harry       100%

    */
    alice_ICR = await cdpManager.getCurrentICR(alice, price)
    bob_ICR = await cdpManager.getCurrentICR(bob, price)
    carol_ICR = await cdpManager.getCurrentICR(carol, price)
    dennis_ICR = await cdpManager.getCurrentICR(dennis, price)
    erin_ICR = await cdpManager.getCurrentICR(erin, price)
    freddy_ICR = await cdpManager.getCurrentICR(freddy, price)
    greta_ICR = await cdpManager.getCurrentICR(greta, price)
    harry_ICR = await cdpManager.getCurrentICR(harry, price)

    // Alice and Bob should have ICR > 150%
    assert.isTrue(alice_ICR.gt(_150percent))
    assert.isTrue(bob_ICR.gt(_150percent))
    // All other CDPs should have ICR < 150%
    assert.isTrue(carol_ICR.lt(_150percent))
    assert.isTrue(dennis_ICR.lt(_150percent))
    assert.isTrue(erin_ICR.lt(_150percent))
    assert.isTrue(freddy_ICR.lt(_150percent))
    assert.isTrue(greta_ICR.lt(_150percent))
    assert.isTrue(harry_ICR.lt(_150percent))

    /* Liquidations should occur from the lowest ICR CDP upwards, i.e. 
    1) Harry, 2) Greta, 3) Freddy, etc.

      CDP         ICR
    Alice       161%
    Bob         158%
    Carol       129%
    Dennis      123%
    ---- CUTOFF ----
    Elisa       117%
    Freddy      113%
    Greta       106%
    Harry       100%

    If all CDPs below the cutoff are liquidated, the TCR of the system rises above the CCR, to 152%.  (see calculations in Google Sheet)

    Thus, after liquidateCDPs(), expect all CDPs to be liquidated up to the cut-off.  
    
    Only Alice, Bob, Carol and Dennis should remain active - all others should be closed. */

    // call liquidate CDPs
    await cdpManager.liquidateCDPs(10);

    // check system is no longer in Recovery Mode
    const recoveryMode_After = await cdpManager.checkRecoveryMode()
    assert.isFalse(recoveryMode_After)

    // After liquidation, TCR should rise to above 150%. 
    const TCR_After = await poolManager.getTCR()
    assert.isTrue(TCR_After.gt(_150percent))

    // get all CDPs
    const alice_CDP = await cdpManager.CDPs(alice)
    const bob_CDP = await cdpManager.CDPs(bob)
    const carol_CDP = await cdpManager.CDPs(carol)
    const dennis_CDP = await cdpManager.CDPs(dennis)
    const erin_CDP = await cdpManager.CDPs(erin)
    const freddy_CDP = await cdpManager.CDPs(freddy)
    const greta_CDP = await cdpManager.CDPs(greta)
    const harry_CDP = await cdpManager.CDPs(harry)

    // check that Alice, Bob, Carol, & Dennis' CDPs remain active
    assert.equal(alice_CDP[3], 1)
    assert.equal(bob_CDP[3], 1)
    assert.equal(carol_CDP[3], 1)
    assert.equal(dennis_CDP[3], 1)
    assert.isTrue(await sortedCDPs.contains(alice))
    assert.isTrue(await sortedCDPs.contains(bob))
    assert.isTrue(await sortedCDPs.contains(carol))
    assert.isTrue(await sortedCDPs.contains(dennis))

    // check all other CDPs are closed
    assert.equal(erin_CDP[3], 2)
    assert.equal(freddy_CDP[3], 2)
    assert.equal(greta_CDP[3], 2)
    assert.equal(harry_CDP[3], 2)
    assert.isFalse(await sortedCDPs.contains(erin))
    assert.isFalse(await sortedCDPs.contains(freddy))
    assert.isFalse(await sortedCDPs.contains(greta))
    assert.isFalse(await sortedCDPs.contains(harry))
  })

  it("liquidateCDPs(): Liquidates CDPs until 1) system has left recovery mode AND 2) it reaches a CDP with ICR >= 110%", async () => {
    // make 6 CDPs accordingly
    // --- SETUP ---

    await borrowerOperations.openLoan(0, alice, { from: alice, value: _30_Ether })
    await borrowerOperations.openLoan(0, bob, { from: bob, value: _3_Ether })
    await borrowerOperations.openLoan(0, carol, { from: carol, value: _3_Ether })
    await borrowerOperations.openLoan(0,  dennis, { from: dennis, value: _3_Ether })
    await borrowerOperations.openLoan(0, erin, { from: erin, value: _3_Ether })
    await borrowerOperations.openLoan(0, freddy, { from: freddy, value: _3_Ether })

    // Alice withdraws 1400 CLV, the others each withdraw 250 CLV 
    await borrowerOperations.withdrawCLV('1400000000000000000000', alice, { from: alice })  // 1400 CLV -> ICR = 429%
    await borrowerOperations.withdrawCLV('250000000000000000000', bob, { from: bob }) //  250 CLV -> ICR = 240%
    await borrowerOperations.withdrawCLV('250000000000000000000', carol, { from: carol }) // 250 CLV -> ICR = 240%
    await borrowerOperations.withdrawCLV('250000000000000000000', dennis, { from: dennis }) // 250 CLV -> ICR = 240%
    await borrowerOperations.withdrawCLV('250000000000000000000', erin, { from: erin }) // 250 CLV -> ICR = 240%
    await borrowerOperations.withdrawCLV('250000000000000000000', freddy, { from: freddy }) // 250 CLV -> ICR = 240%

    // Alice deposits 1400 CLV to Stability Pool
    await poolManager.provideToSP('1400000000000000000000', { from: alice })

    // price drops to 1ETH:85CLV, reducing TCR below 150%
    await priceFeed.setPrice('85000000000000000000')
    const price = await priceFeed.getPrice()

    // check Recovery Mode kicks in

    const recoveryMode_Before = await cdpManager.checkRecoveryMode()
    assert.isTrue(recoveryMode_Before)

    // check TCR < 150%
    const _150percent = web3.utils.toBN('1500000000000000000')
    const TCR_Before = await poolManager.getTCR()
    assert.isTrue(TCR_Before.lt(_150percent))

    /* 
   After the price drop and prior to any liquidations, ICR should be:

    CDP         ICR
    Alice       182%
    Bob         102%
    Carol       102%
    Dennis      102%
    Elisa       102%
    Freddy      102%
    */
    alice_ICR = await cdpManager.getCurrentICR(alice, price)
    bob_ICR = await cdpManager.getCurrentICR(bob, price)
    carol_ICR = await cdpManager.getCurrentICR(carol, price)
    dennis_ICR = await cdpManager.getCurrentICR(dennis, price)
    erin_ICR = await cdpManager.getCurrentICR(erin, price)
    freddy_ICR = await cdpManager.getCurrentICR(freddy, price)

    // Alice should have ICR > 150%
    assert.isTrue(alice_ICR.gt(_150percent))
    // All other CDPs should have ICR < 150%
    assert.isTrue(carol_ICR.lt(_150percent))
    assert.isTrue(dennis_ICR.lt(_150percent))
    assert.isTrue(erin_ICR.lt(_150percent))
    assert.isTrue(freddy_ICR.lt(_150percent))

    /* Liquidations should occur from the lowest ICR CDP upwards, i.e. 
    1) Freddy, 2) Elisa, 3) Dennis.

    After liquidating Freddy and Elisa, the the TCR of the system rises above the CCR, to 154%.  
   (see calculations in Google Sheet)

    Liquidations continue until all CDPs with ICR < MCR have been closed. 
    Only Alice should remain active - all others should be closed. */

    // call liquidate CDPs
    await cdpManager.liquidateCDPs(6);

    // check system is no longer in Recovery Mode
    const recoveryMode_After = await cdpManager.checkRecoveryMode()
    assert.isFalse(recoveryMode_After)

    // After liquidation, TCR should rise to above 150%. 
    const TCR_After = await poolManager.getTCR()
    assert.isTrue(TCR_After.gt(_150percent))

    // get all CDPs
    const alice_CDP = await cdpManager.CDPs(alice)
    const bob_CDP = await cdpManager.CDPs(bob)
    const carol_CDP = await cdpManager.CDPs(carol)
    const dennis_CDP = await cdpManager.CDPs(dennis)
    const erin_CDP = await cdpManager.CDPs(erin)
    const freddy_CDP = await cdpManager.CDPs(freddy)

    // check that Alice's CDP remains active
    assert.equal(alice_CDP[3], 1)
    assert.isTrue(await sortedCDPs.contains(alice))

    // check all other CDPs are closed
    assert.equal(bob_CDP[3], 2)
    assert.equal(carol_CDP[3], 2)
    assert.equal(dennis_CDP[3], 2)
    assert.equal(erin_CDP[3], 2)
    assert.equal(freddy_CDP[3], 2)

    assert.isFalse(await sortedCDPs.contains(bob))
    assert.isFalse(await sortedCDPs.contains(carol))
    assert.isFalse(await sortedCDPs.contains(dennis))
    assert.isFalse(await sortedCDPs.contains(erin))
    assert.isFalse(await sortedCDPs.contains(freddy))
  })

  it('liquidateCDPs(): liquidates only up to the requested number of undercollateralized troves', async () => {
    await borrowerOperations.openLoan('20000000000000000000000', whale, { from: whale, value: mv._300_Ether })

    // --- SETUP --- 
    // Alice, Bob, Carol, Dennis, Erin open troves with consecutively decreasing collateral ratio
    await borrowerOperations.openLoan('105000000000000000000', alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan('104000000000000000000', bob, { from: bob, value: mv._1_Ether })
    await borrowerOperations.openLoan('103000000000000000000', carol, { from: carol, value: mv._1_Ether })
    await borrowerOperations.openLoan('102000000000000000000', dennis, { from: dennis, value: mv._1_Ether })
    await borrowerOperations.openLoan('101000000000000000000', erin, { from: erin, value: mv._1_Ether })

    await priceFeed.setPrice(mv._100e18)

    const TCR = await poolManager.getTCR()

    assert.isTrue(TCR.lte(web3.utils.toBN(mv._150e18)))
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // --- TEST --- 

    // Price drops
    await priceFeed.setPrice(mv._100e18)

    await cdpManager.liquidateCDPs(3)

    // Check system still in Recovery Mode after liquidation tx
    assert.isTrue(await cdpManager.checkRecoveryMode())

    const CDPOwnersArrayLength = await cdpManager.getCDPOwnersCount()
    assert.equal(CDPOwnersArrayLength, '3')

    // Check Alice, Bob, Carol troves have been closed
    const aliceCDPStatus = (await cdpManager.getCDPStatus(alice)).toString()
    const bobCDPStatus = (await cdpManager.getCDPStatus(bob)).toString()
    const carolCDPStatus = (await cdpManager.getCDPStatus(carol)).toString()

    assert.equal(aliceCDPStatus, '2')
    assert.equal(bobCDPStatus, '2')
    assert.equal(carolCDPStatus, '2')

    //  Check Alice, Bob, and Carol's trove are no longer in the sorted list
    const alice_isInSortedList = await sortedCDPs.contains(alice)
    const bob_isInSortedList = await sortedCDPs.contains(bob)
    const carol_isInSortedList = await sortedCDPs.contains(carol)

    assert.isFalse(alice_isInSortedList)
    assert.isFalse(bob_isInSortedList)
    assert.isFalse(carol_isInSortedList)

    // Check Dennis, Erin still have active troves
    const dennisCDPStatus = (await cdpManager.getCDPStatus(dennis)).toString()
    const erinCDPStatus = (await cdpManager.getCDPStatus(erin)).toString()

    assert.equal(dennisCDPStatus, '1')
    assert.equal(erinCDPStatus, '1')

    // Check Dennis, Erin still in sorted list
    const dennis_isInSortedList = await sortedCDPs.contains(dennis)
    const erin_isInSortedList = await sortedCDPs.contains(erin)

    assert.isTrue(dennis_isInSortedList)
    assert.isTrue(erin_isInSortedList)
  })

  it("liquidateCDPs(): does nothing if n = 0", async () => {
    await borrowerOperations.openLoan(mv._100e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._200e18, bob, { from: bob, value: mv._2_Ether })
    await borrowerOperations.openLoan(mv._300e18, carol, { from: carol, value: mv._3_Ether })

    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    const TCR_Before = (await poolManager.getTCR()).toString()

    // Confirm A, B, C ICRs are below 110%

    const alice_ICR = await cdpManager.getCurrentICR(alice, price)
    const bob_ICR = await cdpManager.getCurrentICR(bob, price)
    const carol_ICR = await cdpManager.getCurrentICR(carol, price)
    assert.isTrue(alice_ICR.lte(mv._MCR))
    assert.isTrue(bob_ICR.lte(mv._MCR))
    assert.isTrue(carol_ICR.lte(mv._MCR))

    assert.isTrue(await cdpManager.checkRecoveryMode())
    
    // Liquidation with n = 0
    await cdpManager.liquidateCDPs(0)

    // Check all troves are still in the system
    assert.isTrue(await sortedCDPs.contains(alice))
    assert.isTrue(await sortedCDPs.contains(bob))
    assert.isTrue(await sortedCDPs.contains(carol))

    const TCR_After = (await poolManager.getTCR()).toString()

    // Check TCR has not changed after liquidation
    assert.equal(TCR_Before, TCR_After)
  })

  it('liquidateCDPs(): closes every CDP with ICR < MCR, when n > number of undercollateralized troves', async () => {
    // --- SETUP ---
    await borrowerOperations.openLoan(mv._500e18, whale, { from: whale, value: mv._10_Ether })
    
    // create 5 CDPs with varying ICRs
    await borrowerOperations.openLoan(mv._200e18, alice, { from: alice, value: mv._2_Ether })
    await borrowerOperations.openLoan(mv._150e18, bob, { from: bob, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._300e18, carol, { from: carol, value: mv._3_Ether })
    await borrowerOperations.openLoan(mv._110e18, erin, { from: erin, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._180e18, freddy, { from: freddy, value: mv._1_Ether })

    // Whale puts some tokens in Stability Pool
    await poolManager.provideToSP(mv._300e18, {from: whale})
   
    // --- TEST ---

    // Price drops to 1ETH:100CLV, reducing Bob and Carol's ICR below MCR
    await priceFeed.setPrice(mv._100e18);
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Confirm troves A-E are ICR < 110%
    assert.isTrue((await cdpManager.getCurrentICR(alice, price)).lte(mv._MCR))
    assert.isTrue((await cdpManager.getCurrentICR(bob, price)).lte(mv._MCR))
    assert.isTrue((await cdpManager.getCurrentICR(carol, price)).lte(mv._MCR))
    assert.isTrue((await cdpManager.getCurrentICR(erin, price)).lte(mv._MCR))
    assert.isTrue((await cdpManager.getCurrentICR(freddy, price)).lte(mv._MCR))

    // Confirm Whale is ICR > 110% 
    assert.isTrue((await cdpManager.getCurrentICR(whale, price)).gte(mv._MCR))

    // Liquidate 5 troves
    await cdpManager.liquidateCDPs(5);

    // Confirm troves A-E have been removed from the system
    assert.isFalse(await sortedCDPs.contains(alice))
    assert.isFalse(await sortedCDPs.contains(bob))
    assert.isFalse(await sortedCDPs.contains(carol))
    assert.isFalse(await sortedCDPs.contains(erin))
    assert.isFalse(await sortedCDPs.contains(freddy))

    // Check all troves are now closed
    assert.equal((await cdpManager.CDPs(alice))[3].toString(), '2')
    assert.equal((await cdpManager.CDPs(bob))[3].toString(), '2')
    assert.equal((await cdpManager.CDPs(carol))[3].toString(), '2')
    assert.equal((await cdpManager.CDPs(erin))[3].toString(), '2')
    assert.equal((await cdpManager.CDPs(freddy))[3].toString(), '2')
  })

  it("liquidateCDPs(): a liquidation sequence containing Pool offsets increases the TCR", async () => {
    // Whale provides 500 CLV to SP
    await borrowerOperations.openLoan(mv._500e18, whale, { from: whale, value: mv._5_Ether })
    await poolManager.provideToSP(mv._500e18, { from: whale })

    await borrowerOperations.openLoan(0, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(0, carol, { from: carol, value: mv._2_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: mv._3_Ether })

    await borrowerOperations.openLoan('101000000000000000000', defaulter_1, { from: defaulter_1, value: mv._1_Ether })
    await borrowerOperations.openLoan('217000000000000000000', defaulter_2, { from: defaulter_2, value: mv._2_Ether })
    await borrowerOperations.openLoan('328000000000000000000', defaulter_3, { from: defaulter_3, value: mv._3_Ether })
    await borrowerOperations.openLoan('431000000000000000000', defaulter_4, { from: defaulter_4, value: mv._4_Ether })

    assert.isTrue((await sortedCDPs.contains(defaulter_1)))
    assert.isTrue((await sortedCDPs.contains(defaulter_2)))
    assert.isTrue((await sortedCDPs.contains(defaulter_3)))
    assert.isTrue((await sortedCDPs.contains(defaulter_4)))

    
    // Price drops
    await priceFeed.setPrice(mv._110e18)
    const price = await priceFeed.getPrice()

    assert.isTrue(await th.ICRbetween100and110(defaulter_1, cdpManager, price))
    assert.isTrue(await th.ICRbetween100and110(defaulter_2, cdpManager, price))
    assert.isTrue(await th.ICRbetween100and110(defaulter_3, cdpManager, price))
    assert.isTrue(await th.ICRbetween100and110(defaulter_4, cdpManager, price))

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    const TCR_Before = await poolManager.getTCR()

    // Check Stability Pool has 500 CLV
    assert.equal((await stabilityPool.getCLV()).toString(), mv._500e18)

    await cdpManager.liquidateCDPs(8)
 
    // assert.isFalse((await sortedCDPs.contains(defaulter_1)))
    // assert.isFalse((await sortedCDPs.contains(defaulter_2)))
    // assert.isFalse((await sortedCDPs.contains(defaulter_3)))
    assert.isFalse((await sortedCDPs.contains(defaulter_4)))

    // Check Stability Pool has been emptied by the liquidations
    assert.equal((await stabilityPool.getCLV()).toString(), '0')

    // Check that the liquidation sequence has improved the TCR
    const TCR_After = await poolManager.getTCR()
    assert.isTrue(TCR_After.gte(TCR_Before))
  })

  it("liquidateCDPs(): A liquidation sequence of pure redistributions does not decrease the TCR", async () => {
    await borrowerOperations.openLoan(mv._500e18, whale, { from: whale, value: mv._5_Ether })
    await borrowerOperations.openLoan(0, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(0, carol, { from: carol, value: mv._2_Ether })
    await borrowerOperations.openLoan(0, dennis, { from: dennis, value: mv._3_Ether })

    await borrowerOperations.openLoan('101000000000000000000', defaulter_1, { from: defaulter_1, value: mv._1_Ether })
    await borrowerOperations.openLoan('257000000000000000000', defaulter_2, { from: defaulter_2, value: mv._2_Ether })
    await borrowerOperations.openLoan('328000000000000000000', defaulter_3, { from: defaulter_3, value: mv._3_Ether })
    await borrowerOperations.openLoan('480000000000000000000', defaulter_4, { from: defaulter_4, value: mv._4_Ether })

    assert.isTrue((await sortedCDPs.contains(defaulter_1)))
    assert.isTrue((await sortedCDPs.contains(defaulter_2)))
    assert.isTrue((await sortedCDPs.contains(defaulter_3)))
    assert.isTrue((await sortedCDPs.contains(defaulter_4)))

    // Price drops
    await priceFeed.setPrice(mv._100e18)

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    const TCR_Before = await poolManager.getTCR()

    // Check pool is empty before liquidation
    assert.equal((await stabilityPool.getCLV()).toString(), '0')

    // Liquidate
    await cdpManager.liquidateCDPs(8)

    // Check all defaulters have been liquidated
    assert.isFalse((await sortedCDPs.contains(defaulter_1)))
    assert.isFalse((await sortedCDPs.contains(defaulter_2)))
    assert.isFalse((await sortedCDPs.contains(defaulter_3)))
    assert.isFalse((await sortedCDPs.contains(defaulter_4)))

    // Check that the liquidation sequence has not reduced the TCR
    const TCR_After = await poolManager.getTCR()
    assert.isTrue(TCR_After.gte(TCR_Before))
  })

  it("liquidateCDPs(): liquidates based on entire/collateral debt (including pending rewards), not raw collateral/debt", async () => {
    await borrowerOperations.openLoan(mv._50e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan('90500000000000000000', bob, { from: bob, value: mv._1_Ether })  // 90.5 CLV, 1 ETH
    await borrowerOperations.openLoan(mv._100e18, carol, { from: carol, value: mv._1_Ether })

    // Defaulter opens with 30 CLV, 0.3 ETH
    await borrowerOperations.openLoan(mv._30e18, defaulter_1, { from: defaulter_1, value: mv._3e17 })

    // Price drops
    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    const alice_ICR_Before = await cdpManager.getCurrentICR(alice, price)
    const bob_ICR_Before = await cdpManager.getCurrentICR(bob, price)
    const carol_ICR_Before = await cdpManager.getCurrentICR(carol, price)

    /* Before liquidation: 
    Alice ICR: = (1 * 100 / 50) = 200%
    Bob ICR: (1 * 100 / 90.5) = 110.5%
    Carol ICR: (1 * 100 / 100 ) =  100%

    Therefore Alice and Bob above the MCR, Carol is below */
    assert.isTrue(alice_ICR_Before.gte(mv._MCR))
    assert.isTrue(bob_ICR_Before.gte(mv._MCR))
    assert.isTrue(carol_ICR_Before.lte(mv._MCR))

    // Liquidate defaulter. 30 CLV and 0.3 ETH is distributed uniformly between A, B and C. Each receive 10 CLV, 0.1 ETH
    await cdpManager.liquidate(defaulter_1)

    const alice_ICR_After = await cdpManager.getCurrentICR(alice, price)
    const bob_ICR_After = await cdpManager.getCurrentICR(bob, price)
    const carol_ICR_After = await cdpManager.getCurrentICR(carol, price)

    /* After liquidation: 

    Alice ICR: (1.1 * 100 / 60) = 183.33%
    Bob ICR:(1.1 * 100 / 100.5) =  109.45%
    Carol ICR: (1.1 * 100 ) 100%

    Check Alice is above MCR, Bob below, Carol below. */
    assert.isTrue(alice_ICR_After.gte(mv._MCR))
    assert.isTrue(bob_ICR_After.lte(mv._MCR))
    assert.isTrue(carol_ICR_After.lte(mv._MCR))

     /* Though Bob's true ICR (including pending rewards) is below the MCR, 
    check that Bob's raw coll and debt has not changed, and that his "raw" ICR is above the MCR */
    const bob_Coll = (await cdpManager.CDPs(bob))[1]
    const bob_Debt = (await cdpManager.CDPs(bob))[0]

    const bob_rawICR = bob_Coll.mul(mv._100e18BN).div(bob_Debt)
    assert.isTrue(bob_rawICR.gte(mv._MCR))

    // Liquidate A, B, C
    await cdpManager.liquidateCDPs(10)

     /*  Since there is 0 CLV in the stability Pool, A, with ICR >110%, should stay active.
    Check Alice stays active, Carol gets liquidated, and Bob gets liquidated 
    (because his pending rewards bring his ICR < MCR) */
    assert.isTrue(await sortedCDPs.contains(alice))
    assert.isFalse(await sortedCDPs.contains(bob))
    assert.isFalse(await sortedCDPs.contains(carol))

    // check trove statuses - A active (1),  B and C closed (2)
    assert.equal((await cdpManager.CDPs(alice))[3].toString(), '1')
    assert.equal((await cdpManager.CDPs(bob))[3].toString(), '2')
    assert.equal((await cdpManager.CDPs(carol))[3].toString(), '2')
  })

  it('liquidateCDPs(): does nothing if all troves have ICR > 110% and Stability Pool is empty', async () => {
    await borrowerOperations.openLoan(mv._90e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._80e18, bob, { from: bob, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._70e18, carol, { from: carol, value: mv._1_Ether })

    // Price drops, but all troves remain active at 111% ICR
    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    assert.isTrue((await sortedCDPs.contains(alice)))
    assert.isTrue((await sortedCDPs.contains(bob)))
    assert.isTrue((await sortedCDPs.contains(carol)))

    const TCR_Before = (await poolManager.getTCR()).toString()
    const listSize_Before = (await sortedCDPs.getSize()).toString()


    assert.isTrue((await cdpManager.getCurrentICR(alice, price)).gte(mv._MCR))
    assert.isTrue((await cdpManager.getCurrentICR(bob, price)).gte(mv._MCR))
    assert.isTrue((await cdpManager.getCurrentICR(carol, price)).gte(mv._MCR))

    // Confirm 0 CLV in Stability Pool
    assert.equal((await stabilityPool.getCLV()).toString(), '0')
    
    // Attempt liqudation sequence
    await cdpManager.liquidateCDPs(10)

    // Check all troves remain active
    assert.isTrue((await sortedCDPs.contains(alice)))
    assert.isTrue((await sortedCDPs.contains(bob)))
    assert.isTrue((await sortedCDPs.contains(carol)))

    const TCR_After = (await poolManager.getTCR()).toString()
    const listSize_After = (await sortedCDPs.getSize()).toString()

    assert.equal(TCR_Before, TCR_After)
    assert.equal(listSize_Before, listSize_After)
  })

  it("liquidateCDPs(): does not affect the liquidated user's token balances", async () => {
    await borrowerOperations.openLoan(mv._1000e18, whale, { from: whale, value: mv._15_Ether })

    // D, E, F open loans that will fall below MCR when price drops to 100
    await borrowerOperations.openLoan(mv._100e18, dennis, { from: dennis, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._150e18, erin, { from: erin, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._180e18, freddy, { from: freddy, value: mv._1_Ether })

    // Check list size is 4
    assert.equal((await sortedCDPs.getSize()).toString(), '4')

    // Check token balances before
    assert.equal((await clvToken.balanceOf(dennis)).toString(), mv._100e18)
    assert.equal((await clvToken.balanceOf(erin)).toString(), mv._150e18)
    assert.equal((await clvToken.balanceOf(freddy)).toString(), mv._180e18)

    // Price drops
    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    //Liquidate sequence
    await cdpManager.liquidateCDPs(10)

    // Check Whale remains in the system
    assert.isTrue(await sortedCDPs.contains(whale))

    // Check D, E, F have been removed
    assert.isFalse(await sortedCDPs.contains(dennis))
    assert.isFalse(await sortedCDPs.contains(erin))
    assert.isFalse(await sortedCDPs.contains(freddy))

    // Check token balances of users whose troves were liquidated, have not changed
    assert.equal((await clvToken.balanceOf(dennis)).toString(), mv._100e18)
    assert.equal((await clvToken.balanceOf(erin)).toString(), mv._150e18)
    assert.equal((await clvToken.balanceOf(freddy)).toString(), mv._180e18)
  })

  it("liquidateCDPs(): Liquidating troves at 100 < ICR < 110 with SP deposits correctly impacts their SP deposit and ETH gain", async () => {
    // Whale provides 400 CLV to the SP
    await borrowerOperations.openLoan(mv._400e18, whale, { from: whale, value: mv._6_Ether })
    await poolManager.provideToSP(mv._400e18, { from: whale })

    await borrowerOperations.openLoan(mv._100e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._300e18, bob, { from: bob, value: mv._3_Ether })
    await borrowerOperations.openLoan(mv._100e18, carol, { from: carol, value: mv._1_Ether })

    // A, B provide 100, 300 to the SP
    await poolManager.provideToSP(mv._100e18, { from: alice })
    await poolManager.provideToSP(mv._300e18, { from: bob })

    assert.equal((await sortedCDPs.getSize()).toString(), '4')

    // Price drops
    await priceFeed.setPrice(mv._105e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Check 800 CLV in Pool
    assert.equal((await stabilityPool.getCLV()).toString(), mv._800e18)

    // *** Check A, B, C ICRs 100<ICR<110
    const alice_ICR = await cdpManager.getCurrentICR(alice, price)
    const bob_ICR = await cdpManager.getCurrentICR(bob, price)
    const carol_ICR = await cdpManager.getCurrentICR(carol, price)

    assert.isTrue(alice_ICR.gte(mv._ICR100) && alice_ICR.lte(mv._MCR))
    assert.isTrue(bob_ICR.gte(mv._ICR100) && bob_ICR.lte(mv._MCR))
    assert.isTrue(carol_ICR.gte(mv._ICR100) && carol_ICR.lte(mv._MCR))

    // Liquidate
    await cdpManager.liquidateCDPs(10)

    // Check all defaulters have been liquidated
    assert.isFalse((await sortedCDPs.contains(alice)))
    assert.isFalse((await sortedCDPs.contains(bob)))
    assert.isFalse((await sortedCDPs.contains(carol)))

    // check system sized reduced to 1 troves
    assert.equal((await sortedCDPs.getSize()).toString(), '1')

    /* Prior to liquidation, SP deposits were:
    Whale: 400 CLV
    Alice: 100 CLV
    Bob:   300 CLV
    Carol: 0 CLV

    Total CLV in Pool: 800 CLV

    Then, liquidation hits A,B,C: 

    Total liquidated debt = 100 + 300 + 100 = 500 CLV
    Total liquidated ETH = 1 + 3 + 1 = 5 ETH

    Whale CLV Loss: 500 * (400/800) = 250 CLV
    Alice CLV Loss:  500 *(100/800) = 62.5 CLV
    Bob CLV Loss: 500 * (300/800) = 187.5 CLV

    Whale remaining deposit: (400 - 250) = 150 CLV
    Alice remaining deposit: (100 - 62.5) = 37.5 CLV
    Bob remaining deposit: (300 - 187.5) = 112.5 CLV

    Whale ETH Gain: 5 * (400/800) = 2.5 ETH
    Alice ETH Gain: 5 *(100/800) = 0.625 ETH
    Bob ETH Gain: 5 * (300/800) = 1.875 ETH

    Total remaining deposits: 300 CLV
    Total ETH gain: 5 ETH */

    const CLVinSP = (await stabilityPool.getCLV()).toString()
    const ETHinSP = (await stabilityPool.getETH()).toString()

    // Check remaining CLV Deposits and ETH gain, for whale and depositors whose troves were liquidated
    const whale_Deposit_After = (await poolManager.getCompoundedCLVDeposit(whale)).toString()
    const alice_Deposit_After = (await poolManager.getCompoundedCLVDeposit(alice)).toString()
    const bob_Deposit_After = (await poolManager.getCompoundedCLVDeposit(bob)).toString()

    const whale_ETHGain = (await poolManager.getCurrentETHGain(whale)).toString()
    const alice_ETHGain = (await poolManager.getCurrentETHGain(alice)).toString()
    const bob_ETHGain = (await poolManager.getCurrentETHGain(bob)).toString()

    assert.isAtMost(th.getDifference(whale_Deposit_After, mv._150e18), 1000)
    assert.isAtMost(th.getDifference(alice_Deposit_After, '37500000000000000000'), 1000)
    assert.isAtMost(th.getDifference(bob_Deposit_After, '112500000000000000000'), 1000)

    assert.isAtMost(th.getDifference(whale_ETHGain, '2500000000000000000'), 1000)
    assert.isAtMost(th.getDifference(alice_ETHGain, '625000000000000000'), 1000)
    assert.isAtMost(th.getDifference(bob_ETHGain, '1875000000000000000'), 1000)

    // Check total remaining deposits and ETH gain in Stability Pool
    const total_CLVinSP = (await stabilityPool.getCLV()).toString()
    const total_ETHinSP = (await stabilityPool.getETH()).toString()

    assert.isAtMost(th.getDifference(total_CLVinSP, mv._300e18), 1000)
    assert.isAtMost(th.getDifference(total_ETHinSP, mv._5_Ether), 1000)
  })

  it("liquidateCDPs(): Liquidating troves at ICR <=100% with SP deposits does not alter their deposit or ETH gain", async () => {
    // Whale provides 400 CLV to the SP
    await borrowerOperations.openLoan(mv._400e18, whale, { from: whale, value: mv._6_Ether })
    await poolManager.provideToSP(mv._400e18, { from: whale })

    await borrowerOperations.openLoan(mv._180e18, alice, { from: alice, value: mv._1_Ether })
    await borrowerOperations.openLoan(mv._300e18, bob, { from: bob, value: mv._2_Ether })
    await borrowerOperations.openLoan(mv._150e18, carol, { from: carol, value: mv._1_Ether })

    // A, B provide 100, 300 to the SP
    await poolManager.provideToSP(mv._100e18, { from: alice })
    await poolManager.provideToSP(mv._300e18, { from: bob })

    assert.equal((await sortedCDPs.getSize()).toString(), '4')

    // Price drops
    await priceFeed.setPrice(mv._100e18)
    const price = await priceFeed.getPrice()

    // Confirm Recovery Mode
    assert.isTrue(await cdpManager.checkRecoveryMode())

    // Check CLV and ETH in Pool  before
    const CLVinSP_Before = (await stabilityPool.getCLV()).toString()
    const ETHinSP_Before = (await stabilityPool.getETH()).toString()
    assert.equal(CLVinSP_Before, mv._800e18)
    assert.equal(ETHinSP_Before, '0')

    // *** Check A, B, C ICRs < 100
    assert.isTrue((await cdpManager.getCurrentICR(alice, price)).lte(mv._ICR100))
    assert.isTrue((await cdpManager.getCurrentICR(bob, price)).lte(mv._ICR100))
    assert.isTrue((await cdpManager.getCurrentICR(carol, price)).lte(mv._ICR100))

    // Liquidate
    await cdpManager.liquidateCDPs(10)

    // Check all defaulters have been liquidated
    assert.isFalse((await sortedCDPs.contains(alice)))
    assert.isFalse((await sortedCDPs.contains(bob)))
    assert.isFalse((await sortedCDPs.contains(carol)))

    // check system sized reduced to 1 troves
    assert.equal((await sortedCDPs.getSize()).toString(), '1')

    // Check CLV and ETH in Pool after
    const CLVinSP_After = (await stabilityPool.getCLV()).toString()
    const ETHinSP_After = (await stabilityPool.getETH()).toString()
    assert.equal(CLVinSP_Before, CLVinSP_After)
    assert.equal(ETHinSP_Before, ETHinSP_After)

    // Check remaining CLV Deposits and ETH gain, for whale and depositors whose troves were liquidated
    const whale_Deposit_After = (await poolManager.getCompoundedCLVDeposit(whale)).toString()
    const alice_Deposit_After = (await poolManager.getCompoundedCLVDeposit(alice)).toString()
    const bob_Deposit_After = (await poolManager.getCompoundedCLVDeposit(bob)).toString()

    const whale_ETHGain_After = (await poolManager.getCurrentETHGain(whale)).toString()
    const alice_ETHGain_After = (await poolManager.getCurrentETHGain(alice)).toString()
    const bob_ETHGain_After = (await poolManager.getCurrentETHGain(bob)).toString()

    assert.equal(whale_Deposit_After, mv._400e18)
    assert.equal(alice_Deposit_After, mv._100e18)
    assert.equal(bob_Deposit_After, mv._300e18)

    assert.equal(whale_ETHGain_After, '0')
    assert.equal(alice_ETHGain_After, '0')
    assert.equal(bob_ETHGain_After, '0')
  })


})

contract('Reset chain state', async accounts => { })