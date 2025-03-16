use anchor_lang::prelude::*;

#[error_code]
pub enum SimpleSAMIError {
    #[msg("Insufficient funds to enter the game.")]
    InsufficientFunds,

    #[msg("Transfer failed.")]
    TransferFailed,

    #[msg("Error, Invalid amount")]
    InvalidBetAmount,

    #[msg("No winners for this match")]
    NoWinners,
}
