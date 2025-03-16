use crate::*;
use anchor_lang::system_program::{transfer, Transfer};

pub fn enter_game(ctx: Context<EnterGame>) -> Result<()> {
    let bet_amount = ctx.accounts.game_state.bet_amount;
    let player_lamports = ctx.accounts.player.to_account_info().lamports();

    // Verify if the player has enough SOL
    require!(
        player_lamports >= bet_amount,
        SimpleSAMIError::InsufficientFunds
    );

    // **Create a CPI context to transfer SOL**
    let transfer_instruction = Transfer {
        from: ctx.accounts.player.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };

    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_instruction,
    );

    // **Use `invoke` instead of manually adjusting balances**
    transfer(transfer_ctx, bet_amount)?;

    // ✅ Registrar el evento en los logs
    msg!(
        "GameEntered: player = {}, amount = {}",
        ctx.accounts.player.key(),
        bet_amount
    );

    Ok(())
}
