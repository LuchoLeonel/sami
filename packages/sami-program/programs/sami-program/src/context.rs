use crate::*;

// Context to initialize the contract
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 32 + 8)]
    pub game_state: Account<'info, GameState>, // Save the initial configuration of the game
    #[account(mut)]
    pub owner: Signer<'info>, // Admin that initialize the contract
    pub system_program: Program<'info, System>,
}

// Context for a player to enter the game
#[derive(Accounts)]
pub struct EnterGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut)]
    pub game_state: Account<'info, GameState>,
    // CHECK: Vault PDA that stores the funds
    #[account(mut, seeds = [b"vault", game_state.key().as_ref()], bump)]
    pub vault: UncheckedAccount<'info>,
}

// Context for the instruction SendPrizes()
#[derive(Accounts)]
pub struct SendPrizes<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub game_state: Account<'info, GameState>,

    /// CHECK: Vault PDA que almacena los fondos
    #[account(mut, seeds = [b"vault", game_state.key().as_ref()], bump)]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub winner: SystemAccount<'info>, // Assume that the winner is a Solana account

    pub system_program: Program<'info, System>, // Needed for SOL transfers
}

// Context for the instruction `withdraw()`
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>, // Only the owner can withdraw
    #[account(mut)]
    pub game_state: Account<'info, GameState>, // State of the game
    /// CHECK: Vault PDA that hold the funds
    #[account(mut, seeds = [b"vault", game_state.key().as_ref()], bump)]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// Context for the instruction SetBetAmount()
#[derive(Accounts)]
pub struct SetBetAmount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>, // Only the owner can change the bet amount
    #[account(
        mut,
        constraint = game_state.owner == owner.key()  // Only the owner can change it 
    )]
    pub game_state: Account<'info, GameState>, // State of the game to save bet amount
}
