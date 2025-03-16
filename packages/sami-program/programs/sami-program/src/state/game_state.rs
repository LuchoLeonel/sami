use anchor_lang::prelude::*;

#[account]
pub struct GameState {
    pub owner: Pubkey,
    pub bet_amount: u64, // Bet amount
}
