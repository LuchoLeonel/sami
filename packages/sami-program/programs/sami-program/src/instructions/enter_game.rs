use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::errors::SimpleSAMIError;
use crate::state::SimpleSAMI;

#[derive(Accounts)]
pub struct EnterGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        constraint = game_state.owner == owner.key()
    )]
    pub game_state: Account<'info, SimpleSAMI>,

    #[account(
        mut,
        token::mint = game_state.usdc_mint,
        token::authority = player
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = game_state.usdc_mint
    )]
    pub vault_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn enter_game(ctx: Context<EnterGame>) -> Result<()> {
    let game_state = &ctx.accounts.game_state;
    let bet_amount = game_state.bet_amount;

    let cpi_accounts = Transfer {
        from: ctx.accounts.player_token_account.to_account_info(),
        to: ctx.accounts.vault_account.to_account_info(),
        authority: ctx.accounts.player.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    transfer(cpi_ctx, bet_amount).map_err(|_| SimpleSAMIError::TransferFailed.into())?;

    Ok(())
}
