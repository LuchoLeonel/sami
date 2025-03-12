use crate::state::GameState;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount}; // Si `GameState` está en `state/`

/// **Contexto para inicializar el contrato**
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 32 + 8)]
    pub game_state: Account<'info, GameState>, // Guarda la configuración inicial del juego
    #[account(mut)]
    pub owner: Signer<'info>, // Admin que inicializa el contrato
    pub system_program: Program<'info, System>, // Programa del sistema
}

/// **Contexto para que un jugador entre al juego**
#[derive(Accounts)]
pub struct EnterGame<'info> {
    #[account(mut)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub game_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

/// **Contexto para que el admin envíe premios**
#[derive(Accounts)]
pub struct SendPrizes<'info> {
    #[account(mut, has_one = owner)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub game_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

/// **Contexto para que el admin cambie la apuesta**
#[derive(Accounts)]
pub struct SetBet<'info> {
    #[account(mut, has_one = owner)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// **Contexto para retirar fondos**
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = owner)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub game_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
