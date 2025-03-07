use anchor_lang::prelude::*;

#[account]
pub struct SimpleSAMI {
    pub owner: Pubkey,     // Contract owner
    pub usdc_mint: Pubkey, // USDC Token Mint Address
    pub bet_amount: u64,   // Bet amount required to enter the game
}
