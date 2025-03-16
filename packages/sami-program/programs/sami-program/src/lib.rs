use anchor_lang::prelude::*;

mod context;
mod errors;
mod events;
mod instructions;
mod state;

mod constants;
pub use constants::*;
pub use context::*;
pub use errors::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("79B1S7BVpw2DucU74pZZK2SAZTBfe7w16gd52SfcoopZ");

#[program]
pub mod sami_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bet_amount: u64) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.owner = *ctx.accounts.owner.key;
        game_state.bet_amount = bet_amount;

        Ok(())
    }

    pub fn enter_game(ctx: Context<EnterGame>) -> Result<()> {
        instructions::enter_game::enter_game(ctx) // Delegate to enter_game.rs
    }

    pub fn send_prizes(
        ctx: Context<SendPrizes>,
        winners: Vec<Pubkey>,
        prize_amount: u64,
    ) -> Result<()> {
        instructions::send_prizes::send_prizes(ctx, winners, prize_amount) // ✅ Delegamos a send_prizes.rs
    }

    pub fn set_bet_amount(ctx: Context<SetBetAmount>, new_bet_amount: u64) -> Result<()> {
        instructions::set_bet_amount::set_bet_amount(ctx, new_bet_amount) // Delegate to set_bet_amount.rs
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::withdraw(ctx, amount) // Delegate to withdraw.rs
    }
}
