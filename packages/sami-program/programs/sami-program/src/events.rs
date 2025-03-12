use anchor_lang::prelude::*;

/// **Evento: Un jugador entra al juego**
#[event]
pub struct GameEntered {
    pub player: Pubkey, // Dirección del jugador
    pub timestamp: i64, // Momento en que ingresó al juego
}

/// **Evento: Se envían premios a los ganadores**
#[event]
pub struct PrizeSent {
    pub winner: Pubkey, // Dirección del ganador
    pub amount: u64,    // Cantidad del premio
}

/// **Evento: Se cambia el monto de la apuesta**
#[event]
pub struct BetAmountChanged {
    pub new_bet: u64, // Nuevo monto de la apuesta
}

/// **Evento: Se retiran fondos del contrato**
#[event]
pub struct WithdrawFromReserves {
    pub amount: u64, // Cantidad retirada
}
