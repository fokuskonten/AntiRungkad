// ══════════════════════════════════════════════════════════════════════════════
// benchmark_10k.cjs — Standalone 10.000 Spin Benchmark & RTP Verification
// FokusKonten Pro — AntiRungkad (Strict 5x4 Matrix, RTP ~96.5%)
// ══════════════════════════════════════════════════════════════════════════════

async function runBenchmark() {
  const { SlotStateMachine, SlotState } = await import('../src/engine/SlotStateMachine.js');
  const { WalletService } = await import('../src/engine/WalletService.js');
  const { RNGService, GRID_COLS, GRID_ROWS, TOTAL_CELLS } = await import('../src/engine/RNGService.js');

  const SPINS_TOTAL = 10000;
  const BET_PER_SPIN = 5000;
  const INITIAL_WALLET = 1000000;

  const wallet = new WalletService(INITIAL_WALLET);
  const rng = new RNGService();
  const fsm = new SlotStateMachine();

  let totalBets = 0;
  let totalWins = 0;
  let hitSpinsCount = 0;
  let multiCascadeCount = 0;
  let maxWinInSingleSpin = 0;
  let maxMultiplierHit = 1;
  let maxCascadeStepsInSpin = 0;

  const startTime = Date.now();

  for (let i = 0; i < SPINS_TOTAL; i++) {
    // 1. Guard & Deduct
    fsm.transition(SlotState.SPINNING);
    wallet.deductBet(BET_PER_SPIN);
    totalBets += BET_PER_SPIN;

    // 2. Generate 5x4 Grid
    let currentGrid = rng.generateGrid();
    fsm.transition(SlotState.STOPPING);

    let roundBaseWin = 0;
    let roundMultiplier = 1;
    let cascadeSteps = 0;

    // 3. Tumble Cascade Loop
    while (cascadeSteps < 15) {
      const outcome = rng.evaluateStep(currentGrid, BET_PER_SPIN);
      if (outcome.stepOrbsMultiplier > 0) {
        roundMultiplier += outcome.stepOrbsMultiplier;
      }

      if (!outcome.hasWins) break;

      cascadeSteps++;
      roundBaseWin += outcome.stepWinAmount;

      fsm.transition(SlotState.WIN_HIGHLIGHT);
      fsm.transition(SlotState.SHATTER);
      fsm.transition(SlotState.TUMBLE_DROP);

      currentGrid = rng.applyTumble(currentGrid, outcome.winningCellsMap);
    }

    const roundTotalPayout = roundBaseWin * roundMultiplier;
    fsm.transition(SlotState.PAYOUT);

    if (roundTotalPayout > 0) {
      wallet.creditWin(roundTotalPayout);
      totalWins += roundTotalPayout;
      hitSpinsCount++;

      if (cascadeSteps > 1) multiCascadeCount++;
      if (roundTotalPayout > maxWinInSingleSpin) maxWinInSingleSpin = roundTotalPayout;
      if (roundMultiplier > maxMultiplierHit) maxMultiplierHit = roundMultiplier;
      if (cascadeSteps > maxCascadeStepsInSpin) maxCascadeStepsInSpin = cascadeSteps;
    }

    fsm.forceReset();
  }

  const elapsedMs = Date.now() - startTime;
  const rtpPercentage = (totalWins / totalBets) * 100;
  const hitRatePercentage = (hitSpinsCount / SPINS_TOTAL) * 100;

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        HASIL AUDIT BENCHMARK 10.000 SPINS (5x4 MATRIX)           ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║ Ukuran Matrix Game   : ${GRID_COLS} Kolom x ${GRID_ROWS} Baris (${TOTAL_CELLS} Sel Total)`);
  console.log(`║ Total Putaran Uji    : ${SPINS_TOTAL.toLocaleString()} Spins`);
  console.log(`║ Nominal Per Taruhan  : Rp ${BET_PER_SPIN.toLocaleString('id-ID')}`);
  console.log(`║ Total Taruhan Masuk  : Rp ${totalBets.toLocaleString('id-ID')}`);
  console.log(`║ Total Payout Keluar  : Rp ${totalWins.toLocaleString('id-ID')}`);
  console.log(`║ RTP Terukur          : ${rtpPercentage.toFixed(2)}% (Target: 95.0% - 98.0%)`);
  console.log(`║ Hit Frequency        : ${hitRatePercentage.toFixed(2)}% (Target: 25.0% - 35.0%)`);
  console.log(`║ Putaran Multi-Tumble : ${multiCascadeCount.toLocaleString()} kali`);
  console.log(`║ Max Cascade In 1 Spin: ${maxCascadeStepsInSpin} kali runtuhan beruntun`);
  console.log(`║ Kemenangan Tertinggi : Rp ${maxWinInSingleSpin.toLocaleString('id-ID')} (${(maxWinInSingleSpin / BET_PER_SPIN).toFixed(1)}X Bet)`);
  console.log(`║ Max Multiplier Orb   : ${maxMultiplierHit}X`);
  console.log(`║ Durasi Benchmark     : ${elapsedMs} ms (${(SPINS_TOTAL / (elapsedMs / 1000)).toFixed(0)} spins/sec)`);
  console.log(`║ Status FSM Terakhir  : ${fsm.current} [TERKUNCI AMAN DI IDLE]`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
}

runBenchmark().catch(console.error);
