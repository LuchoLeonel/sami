use crate::*;

pub fn send_prizes(
    ctx: Context<SendPrizes>,
    winners: Vec<Pubkey>,
    prize_amount: u64,
) -> Result<()> {
    let vault_balance = ctx.accounts.vault.to_account_info().lamports();
    let num_winners = winners.len() as u64;

    require!(num_winners > 0, SimpleSAMIError::NoWinners);
    require!(
        vault_balance >= num_winners * prize_amount,
        SimpleSAMIError::InsufficientFunds
    );

    for winner in winners.iter() {
        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= prize_amount;
        **ctx
            .accounts
            .winner
            .to_account_info()
            .try_borrow_mut_lamports()? += prize_amount;

        emit!(PrizeSent {
            winner: *winner,
            amount: prize_amount,
        });
    }

    Ok(())
}
