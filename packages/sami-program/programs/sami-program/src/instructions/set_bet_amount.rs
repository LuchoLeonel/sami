use crate::errors::SimpleSAMIError;
use crate::state::SimpleSAMI;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetBetAmount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = game_state.owner == owner.key()
    )]
    pub game_state: Account<'info, SimpleSAMI>,
}

pub fn set_bet_amount(ctx: Context<SetBetAmount>, new_bet_amount: u64) -> Result<()> {
    require!(new_bet_amount > 0, SimpleSAMIError::InvalidBetAmount);

    ctx.accounts.game_state.bet_amount = new_bet_amount;

    Ok(())
}
