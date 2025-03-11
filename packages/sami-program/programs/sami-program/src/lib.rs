use anchor_lang::prelude::*;

declare_id!("4Sdd8MKvmN7YXkFpPPijfur3DaDkQ72kipn68XuC7bSc");

#[program]
pub mod sami_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
