// ══════════════════════════════════════════════════════════════════════════════
// SlotStateMachine.js — Strict Finite State Machine for AntiRungkad Slot Engine
// FokusKonten Pro — Enterprise Architecture (Guarded Transitions & Zero Race)
// ══════════════════════════════════════════════════════════════════════════════

export const SlotState = Object.freeze({
  IDLE:                 'IDLE',                 // Siap menerima input (Spin, Ubah Bet)
  SPINNING:             'SPINNING',             // Taruhan terpotong, reel berputar di layar
  STOPPING:             'STOPPING',             // Kolom reel sedang mendarat berurutan
  WIN_HIGHLIGHT:        'WIN_HIGHLIGHT',        // Simbol pemenang diberi lis emas berjalan
  SHATTER:              'SHATTER',              // Simbol pemenang pecah & lenyap
  TUMBLE_DROP:          'TUMBLE_DROP',          // Simbol atas runtuh & simbol baru spawn
  PAYOUT:               'PAYOUT',               // Hadiah dihitung & dikreditkan ke saldo
  CELEBRATION:          'CELEBRATION'           // Perayaan kemenangan besar (Big Win)
});

export class SlotStateMachine {
  constructor(initialState = SlotState.IDLE) {
    this._state = initialState;
    this._listeners = new Set();

    // Matriks Transisi yang Valid (Mencegah Transisi Ilegal / Race Conditions)
    this._validTransitions = {
      [SlotState.IDLE]:          [SlotState.SPINNING],
      [SlotState.SPINNING]:      [SlotState.STOPPING],
      [SlotState.STOPPING]:      [SlotState.WIN_HIGHLIGHT, SlotState.PAYOUT, SlotState.IDLE],
      [SlotState.WIN_HIGHLIGHT]: [SlotState.SHATTER],
      [SlotState.SHATTER]:       [SlotState.TUMBLE_DROP],
      [SlotState.TUMBLE_DROP]:   [SlotState.WIN_HIGHLIGHT, SlotState.PAYOUT],
      [SlotState.PAYOUT]:        [SlotState.CELEBRATION, SlotState.IDLE],
      [SlotState.CELEBRATION]:   [SlotState.IDLE]
    };
  }

  get current() {
    return this._state;
  }

  get isIdle() {
    return this._state === SlotState.IDLE;
  }

  get canSpin() {
    return this._state === SlotState.IDLE;
  }

  get canChangeBet() {
    return this._state === SlotState.IDLE;
  }

  canTransitionTo(targetState) {
    const allowed = this._validTransitions[this._state];
    return Array.isArray(allowed) && allowed.includes(targetState);
  }

  transition(targetState, payload = {}) {
    if (!this.canTransitionTo(targetState)) {
      console.warn(`[FSM Guard] Transisi Ilegal Ditolak: "${this._state}" -> "${targetState}"`);
      return false;
    }

    const prevState = this._state;
    this._state = targetState;
    this._notify(prevState, targetState, payload);
    return true;
  }

  forceReset() {
    const prevState = this._state;
    this._state = SlotState.IDLE;
    this._notify(prevState, SlotState.IDLE, { forced: true });
  }

  subscribe(listener) {
    this._listeners.add(listener);
    listener(this._state, this._state, {});
    return () => this._listeners.delete(listener);
  }

  _notify(from, to, payload) {
    for (const listener of this._listeners) {
      try {
        listener(from, to, payload);
      } catch (err) {
        console.error('[FSM Listener Error]:', err);
      }
    }
  }
}
