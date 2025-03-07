use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::errors::SimpleSAMIError;
use crate::state::SimpleSAMI;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = game_state.owner == owner.key()
    )]
    pub game_state: Account<'info, SimpleSAMI>,

    #[account(
        mut,
        token::mint = game_state.usdc_mint
    )]
    pub vault_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = game_state.usdc_mint
    )]
    pub owner_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_account.to_account_info(),
        to: ctx.accounts.owner_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    transfer(cpi_ctx, amount).map_err(|_| SimpleSAMIError::TransferFailed.into())?;

    Ok(())
}
