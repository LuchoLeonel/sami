use crate::*;

pub fn enter_game(ctx: Context<EnterGame>) -> Result<()> {
    let bet_amount = ctx.accounts.game_state.bet_amount;
    let player_lamports = ctx.accounts.player.to_account_info().lamports();

    // Verify if the player has enough SOL
    require!(
        player_lamports >= bet_amount,
        SimpleSAMIError::InsufficientFunds
    );

    // Transfer SOL to the vault
    **ctx
        .accounts
        .vault
        .to_account_info()
        .try_borrow_mut_lamports()? += bet_amount;
    **ctx
        .accounts
        .player
        .to_account_info()
        .try_borrow_mut_lamports()? -= bet_amount;

    // Emit event
    emit!(GameEntered {
        player: ctx.accounts.player.key(),
        amount: bet_amount,
    });

    Ok(())
}
