use anchor_lang::prelude::*;

/// A player enters the game
#[event_cpi]
pub struct GameEntered {
    pub player: Pubkey,
    pub amount: u64,
}
/// Sending prizes to winners
#[event]
pub struct PrizeSent {
    pub winner: Pubkey, // Dirección del ganador
    pub amount: u64,    // Cantidad del premio
}

/// It changes the amount of the bet
#[event]
pub struct BetAmountChanged {
    pub new_bet: u64, // Nuevo monto de la apuesta
}

/// **Evento: Se retiran fondos del contrato**
#[event]
pub struct WithdrawFromReserves {
    pub amount: u64, // Cantidad retirada
}
