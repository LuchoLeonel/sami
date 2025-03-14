use crate::*;

pub fn set_bet_amount(ctx: Context<SetBetAmount>, new_bet_amount: u64) -> Result<()> {
    require!(new_bet_amount > 0, SimpleSAMIError::InvalidBetAmount);

    ctx.accounts.game_state.bet_amount = new_bet_amount;

    Ok(())
}
