use anchor_lang::prelude::*;

#[account]
pub struct GameState {
    pub owner: PubKey,     // Address of the owner of the contract
    pub usdc_mint: PubKey, // Address of the token USDC
    pub bet_amount: u64,   // Amount of the bet
}
